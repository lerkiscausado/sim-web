import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { DatosAdjuntos } from '../documentos-soporte/entities/datos-adjuntos.entity';
import { Imagenes } from '../documentos-soporte/entities/imagenes.entity';
import { Ordenes } from '../admisiones/entities/ordenes.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { TIPOS_ESTUDIO_CON_FOTOS } from '../admisiones/estudios-orden';

/** Carpeta donde se guardan los archivos subidos (configurable con STORAGE_DIR en .env). */
export function carpetaAlmacenamiento(...sub: string[]) {
  const base =
    process.env.STORAGE_DIR?.trim() || path.join(process.cwd(), 'storage');
  return path.join(base, ...sub);
}

export interface ArchivoSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_ADJUNTO = 25 * 1024 * 1024;
const MAX_IMAGEN = 10 * 1024 * 1024;
/** Igual que la captura del reporte (imagenes-procedimiento.service). */
const MAX_FOTOS_PROCEDIMIENTO = 30;
const TIPOS_IMAGEN: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Adjuntos (frmAdjuntos → tabla datos_adjuntos) e imágenes del estudio
 * (frmImagenesVideo → tabla imagenes) de una orden. En el escritorio los
 * archivos vivían en rutas de red de cada equipo (x:\pdf, C:\SIM\...); en la
 * web se guardan en la carpeta del servidor y la columna RUTA conserva el
 * nombre del archivo guardado.
 */
@Injectable()
export class ArchivosOrdenService {
  constructor(
    @InjectRepository(DatosAdjuntos)
    private readonly adjuntosRepository: Repository<DatosAdjuntos>,
    @InjectRepository(Imagenes)
    private readonly imagenesRepository: Repository<Imagenes>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(DetalleOrden)
    private readonly detalleRepository: Repository<DetalleOrden>,
  ) {}

  private async validarOrden(idOrden: number) {
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    return orden;
  }

  private async guardarArchivo(carpeta: string, ext: string, buffer: Buffer) {
    const dir = carpetaAlmacenamiento(carpeta);
    await fs.mkdir(dir, { recursive: true });
    const nombre = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    await fs.writeFile(path.join(dir, nombre), buffer);
    return nombre;
  }

  private async leerArchivo(carpeta: string, ruta: string) {
    // win32.basename corta tanto "\\" como "/": sirve para rutas del escritorio (c:\\estudios\\...) y evita rutas relativas.
    const nombre = path.win32.basename((ruta ?? '').trim());
    try {
      return await fs.readFile(carpetaAlmacenamiento(carpeta, nombre));
    } catch {
      throw new NotFoundException(
        'El archivo no está disponible en el servidor (puede haberse cargado desde el sistema de escritorio)',
      );
    }
  }

  // ───────── adjuntos ─────────

  async listarAdjuntos(idOrden: number) {
    return this.adjuntosRepository.find({
      where: { idOrden, estado: EstadoActivoInactivo.ACTIVO },
      order: { id: 'DESC' },
    });
  }

  async subirAdjunto(idOrden: number, nombre: string, archivo?: ArchivoSubido) {
    await this.validarOrden(idOrden);
    if (!nombre?.trim())
      throw new BadRequestException('El Campo Nombre es Obligatorio');
    if (!archivo)
      throw new BadRequestException('No ha seleccionado el adjunto');
    if (archivo.size > MAX_ADJUNTO)
      throw new BadRequestException('El archivo supera los 25 MB');
    const esPdf =
      archivo.mimetype === 'application/pdf' ||
      archivo.buffer.subarray(0, 5).toString() === '%PDF-';
    if (!esPdf) throw new BadRequestException('Solo se permiten archivos PDF');
    const ruta = await this.guardarArchivo('adjuntos', '.pdf', archivo.buffer);
    return this.adjuntosRepository.save(
      this.adjuntosRepository.create({
        idOrden,
        ruta,
        nombre: nombre.trim().slice(0, 100),
        estado: EstadoActivoInactivo.ACTIVO,
      }),
    );
  }

  async archivoAdjunto(id: number) {
    const a = await this.adjuntosRepository.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Adjunto no encontrado');
    return {
      buffer: await this.leerArchivo('adjuntos', a.ruta),
      nombre: `${a.nombre ?? 'adjunto'}.pdf`,
    };
  }

  /** DAdjuntos.Eliminar: el VB.NET borra la fila; aquí se marca inactiva y el archivo se conserva. */
  async eliminarAdjunto(id: number) {
    const a = await this.adjuntosRepository.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Adjunto no encontrado');
    await this.adjuntosRepository.update(
      { id },
      { estado: EstadoActivoInactivo.INACTIVO },
    );
    return { id };
  }

  // ───────── imágenes del estudio ─────────

  /**
   * Imágenes de la orden. Las de procedimientos (endoscopia, colonoscopia, rectoscopia, estudios
   * especiales) salen todas las capturadas, marcando las que van en el informe; las demás, solo
   * las activas (en esas, antes de la migración 009 ESTADO='I' significaba "eliminada").
   */
  async listarImagenes(idOrden: number) {
    const tipos = TIPOS_ESTUDIO_CON_FOTOS.join(',');
    const filas: {
      id: number;
      idOrden: number;
      idDetalleOrden: number;
      ruta: string;
      texto: string | null;
      estado: string;
      procedimiento: number;
      firmada: number;
      ordenInforme: number | null;
    }[] = await this.imagenesRepository.manager.query(
      `SELECT i.ID AS id, i.ID_ORDEN AS idOrden, i.ID_DETALLE_ORDEN AS idDetalleOrden, i.RUTA AS ruta,
              i.TEXTO AS texto, i.ESTADO AS estado, i.orden_informe AS ordenInforme,
              (d.ID_TIPO_ESTUDIO IN (${tipos})) AS procedimiento, COALESCE(e.firmada, 0) AS firmada
       FROM imagenes i
       LEFT JOIN detalle_orden d ON d.ID = i.ID_DETALLE_ORDEN
       LEFT JOIN endoscopias e ON e.ID_DETALLE_ORDEN = i.ID_DETALLE_ORDEN
       WHERE i.ID_ORDEN = ? AND i.eliminada = 0 AND (i.ESTADO = 'A' OR d.ID_TIPO_ESTUDIO IN (${tipos}))
       ORDER BY (i.ESTADO = 'A') DESC, COALESCE(i.orden_informe, 99), i.ID`,
      [idOrden],
    );
    return filas.map((f) => ({
      id: Number(f.id),
      idOrden: Number(f.idOrden),
      idDetalleOrden: Number(f.idDetalleOrden),
      ruta: f.ruta,
      texto: f.texto,
      procedimiento: Number(f.procedimiento) === 1,
      enInforme: Number(f.procedimiento) === 1 && f.estado === 'A',
      firmada: Number(f.firmada) === 1,
    }));
  }

  /** Bloqueo de la Resolución 3100: las fotos de un procedimiento firmado no se cambian. */
  private async asegurarNoFirmado(idDetalleOrden: number) {
    const [e]: { firmada: number | null }[] =
      await this.imagenesRepository.manager.query(
        'SELECT firmada FROM endoscopias WHERE ID_DETALLE_ORDEN = ? LIMIT 1',
        [idDetalleOrden],
      );
    if (Number(e?.firmada) === 1) {
      throw new ConflictException(
        'El estudio ya fue firmado: sus fotos no se pueden cambiar (Resolución 3100). Use una adenda.',
      );
    }
  }

  async subirImagenes(
    idOrden: number,
    archivos: ArchivoSubido[],
    texto?: string,
  ) {
    await this.validarOrden(idOrden);
    if (!archivos?.length)
      throw new BadRequestException('No se recibieron imágenes');
    // Si la orden tiene un procedimiento, las fotos van a esa línea como capturadas (ESTADO='I'):
    // el especialista elige en el reporte cuáles salen en el informe.
    const detalles = await this.detalleRepository.find({
      where: { idOrden: String(idOrden) },
      order: { id: 'ASC' },
    });
    const vigentes = detalles.filter((d) => String(d.estado) !== 'CANCELADO');
    const proc = vigentes.find((d) =>
      TIPOS_ESTUDIO_CON_FOTOS.includes(Number(d.idTipoEstudio)),
    );
    const detalle = proc ?? vigentes[0] ?? detalles[0];
    if (proc) {
      await this.asegurarNoFirmado(proc.id);
      const vivas = await this.imagenesRepository.count({
        where: { idDetalleOrden: proc.id, eliminada: false },
      });
      if (vivas + archivos.length > MAX_FOTOS_PROCEDIMIENTO) {
        throw new BadRequestException(
          `El estudio admite máximo ${MAX_FOTOS_PROCEDIMIENTO} fotos (ya tiene ${vivas}).`,
        );
      }
    }
    const guardadas: Imagenes[] = [];
    for (const a of archivos) {
      const ext = TIPOS_IMAGEN[a.mimetype];
      if (!ext)
        throw new BadRequestException(
          `Formato no permitido: ${a.originalname} (use JPG, PNG o WEBP)`,
        );
      if (a.size > MAX_IMAGEN)
        throw new BadRequestException(`${a.originalname} supera los 10 MB`);
      const ruta = await this.guardarArchivo('imagenes', ext, a.buffer);
      guardadas.push(
        await this.imagenesRepository.save(
          this.imagenesRepository.create({
            idOrden,
            idDetalleOrden: detalle?.id ?? 0,
            ruta,
            texto: (texto ?? '').slice(0, 100) || null,
            estado: proc
              ? EstadoActivoInactivo.INACTIVO
              : EstadoActivoInactivo.ACTIVO,
          }),
        ),
      );
    }
    return guardadas;
  }

  async archivoImagen(id: number) {
    const img = await this.imagenesRepository.findOne({ where: { id } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    const ext = path.extname(img.ruta).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
    return { buffer: await this.leerArchivo('imagenes', img.ruta), mime };
  }

  async actualizarTextoImagen(id: number, texto: string) {
    const img = await this.imagenesRepository.findOne({ where: { id } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    await this.asegurarNoFirmado(img.idDetalleOrden);
    await this.imagenesRepository.update(
      { id },
      { texto: (texto ?? '').slice(0, 100) || null },
    );
    return this.imagenesRepository.findOne({ where: { id } });
  }

  async eliminarImagen(id: number) {
    const img = await this.imagenesRepository.findOne({ where: { id } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    await this.asegurarNoFirmado(img.idDetalleOrden);
    // Borrado lógico (migración 009): ESTADO='I' significa "capturada, no va en el informe".
    await this.imagenesRepository.update(
      { id },
      {
        estado: EstadoActivoInactivo.INACTIVO,
        eliminada: true,
        ordenInforme: null,
      },
    );
    return { id };
  }
}
