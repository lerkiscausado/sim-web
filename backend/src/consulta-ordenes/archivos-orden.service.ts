import {
  BadRequestException,
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
    const nombre = path.basename(ruta); // evita rutas relativas maliciosas
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

  async listarImagenes(idOrden: number) {
    return this.imagenesRepository.find({
      where: { idOrden, estado: EstadoActivoInactivo.ACTIVO },
      order: { id: 'ASC' },
    });
  }

  async subirImagenes(
    idOrden: number,
    archivos: ArchivoSubido[],
    texto?: string,
  ) {
    await this.validarOrden(idOrden);
    if (!archivos?.length)
      throw new BadRequestException('No se recibieron imágenes');
    const detalle = await this.detalleRepository.findOne({
      where: { idOrden: String(idOrden) },
      order: { id: 'ASC' },
    });
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
            estado: EstadoActivoInactivo.ACTIVO,
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
    await this.imagenesRepository.update(
      { id },
      { texto: (texto ?? '').slice(0, 100) || null },
    );
    return this.imagenesRepository.findOne({ where: { id } });
  }

  async eliminarImagen(id: number) {
    const img = await this.imagenesRepository.findOne({ where: { id } });
    if (!img) throw new NotFoundException('Imagen no encontrada');
    await this.imagenesRepository.update(
      { id },
      { estado: EstadoActivoInactivo.INACTIVO },
    );
    return { id };
  }
}
