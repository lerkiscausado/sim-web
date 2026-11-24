import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { Imagenes } from '../documentos-soporte/entities/imagenes.entity';
import { Endoscopias } from '../atenciones/entities/endoscopias.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { carpetaAlmacenamiento } from '../consulta-ordenes/archivos-orden.service';
import { leerArchivoImagen, nombreArchivoImagen } from './imagenes-archivo';
import type { ArchivoSubido } from '../consulta-ordenes/archivos-orden.service';

/** Fotos que se pueden capturar por estudio (el escritorio permitía 50; GASTROLAP pidió 30). */
export const MAX_CAPTURAS = 30;
/** Fotos que caben en el informe (frmImagenesCapturadas: "Solo se admiten (9) imagenes"). */
export const MAX_EN_INFORME = 9;
const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Solo los reportes de procedimientos llevan fotos: endoscopia, colonoscopia, rectoscopia
 * y estudios especiales (IDs de tipo_estudio, igual que el escritorio). Las historias
 * clínicas (primera vez, control, preanestésica) no.
 */
const TIPOS_ESTUDIO_CON_FOTOS = [10, 11, 12, 15];

const MENSAJE_FIRMADO =
  'El estudio ya fue firmado: las fotos del informe no se pueden cambiar (Resolución 3100). Use una adenda.';

export interface ImagenProcedimiento {
  id: number;
  texto: string;
  enInforme: boolean;
  ordenInforme: number | null;
  fecha: Date | null;
}

@Injectable()
export class ImagenesProcedimientoService {
  constructor(
    @InjectRepository(Imagenes) private readonly repo: Repository<Imagenes>,
    @InjectRepository(Endoscopias)
    private readonly endoscopias: Repository<Endoscopias>,
    private readonly ds: DataSource,
  ) {}

  private async detalle(idDetalleOrden: number) {
    const [d]: { id: string; idOrden: string; idTipoEstudio: number }[] =
      await this.ds.query(
        'SELECT ID AS id, CAST(ID_ORDEN AS UNSIGNED) AS idOrden, ID_TIPO_ESTUDIO AS idTipoEstudio FROM detalle_orden WHERE ID = ? LIMIT 1',
        [idDetalleOrden],
      );
    if (!d)
      throw new NotFoundException(
        `Línea de orden ${idDetalleOrden} no encontrada`,
      );
    if (!TIPOS_ESTUDIO_CON_FOTOS.includes(Number(d.idTipoEstudio))) {
      throw new BadRequestException(
        'Las fotos solo aplican a reportes de procedimientos (endoscopia, colonoscopia, rectoscopia, estudios especiales).',
      );
    }
    return { id: Number(d.id), idOrden: Number(d.idOrden) };
  }

  private async asegurarEditable(idDetalleOrden: number) {
    const e = await this.endoscopias.findOne({ where: { idDetalleOrden } });
    if (e?.firmada) throw new ConflictException(MENSAJE_FIRMADO);
  }

  private aVista(i: Imagenes): ImagenProcedimiento {
    return {
      id: i.id,
      texto: (i.texto ?? '').trim(),
      enInforme: i.estado === EstadoActivoInactivo.ACTIVO,
      ordenInforme: i.ordenInforme ?? null,
      fecha: i.createdAt ?? null,
    };
  }

  private vivas(idDetalleOrden: number) {
    return this.repo.find({
      where: { idDetalleOrden, eliminada: false },
      order: { id: 'ASC' },
    });
  }

  async listar(idDetalleOrden: number) {
    await this.detalle(idDetalleOrden);
    const filas = await this.vivas(idDetalleOrden);
    return {
      maxCapturas: MAX_CAPTURAS,
      maxEnInforme: MAX_EN_INFORME,
      imagenes: filas.map((f) => this.aVista(f)),
    };
  }

  /** Fotos que salen en el PDF, en el orden elegido (las históricas sin orden van por ID). */
  async paraInforme(idDetalleOrden: number) {
    const filas = await this.repo.find({
      where: {
        idDetalleOrden,
        eliminada: false,
        estado: EstadoActivoInactivo.ACTIVO,
      },
      order: { id: 'ASC' },
    });
    return filas
      .sort(
        (a, b) =>
          (a.ordenInforme ?? 99) - (b.ordenInforme ?? 99) || a.id - b.id,
      )
      .slice(0, MAX_EN_INFORME);
  }

  async capturar(idDetalleOrden: number, archivo?: ArchivoSubido) {
    const d = await this.detalle(idDetalleOrden);
    await this.asegurarEditable(idDetalleOrden);
    if (!archivo) throw new BadRequestException('No se recibió la foto');
    const ext = TIPOS[archivo.mimetype];
    if (!ext)
      throw new BadRequestException(
        'Formato no permitido (use JPG, PNG o WEBP)',
      );
    if (archivo.size > MAX_BYTES)
      throw new BadRequestException('La foto supera los 8 MB');
    const total = await this.repo.count({
      where: { idDetalleOrden, eliminada: false },
    });
    if (total >= MAX_CAPTURAS) {
      throw new BadRequestException(
        `Se alcanzó el máximo de ${MAX_CAPTURAS} fotos para este estudio. Elimine alguna para capturar otra.`,
      );
    }
    const dir = carpetaAlmacenamiento('imagenes');
    await fs.mkdir(dir, { recursive: true });
    const nombre = `${d.idOrden}-${idDetalleOrden}-${Date.now()}-${randomUUID().slice(0, 6)}${ext}`;
    await fs.writeFile(path.join(dir, nombre), archivo.buffer);
    const fila = await this.repo.save(
      this.repo.create({
        idOrden: d.idOrden,
        idDetalleOrden,
        ruta: nombre,
        texto: null,
        estado: EstadoActivoInactivo.INACTIVO, // capturada, aún no va en el informe
        ordenInforme: null,
        eliminada: false,
      }),
    );
    return this.aVista(fila);
  }

  private async imagen(id: number) {
    const img = await this.repo.findOne({ where: { id } });
    if (!img || img.eliminada)
      throw new NotFoundException('Foto no encontrada');
    return img;
  }

  async archivo(id: number) {
    const img = await this.imagen(id);
    const buffer = await leerArchivoImagen(img.ruta);
    if (!buffer) {
      throw new NotFoundException(
        'El archivo de esta foto no está en el servidor (puede seguir en el equipo de captura del escritorio).',
      );
    }
    const ext = path.extname(nombreArchivoImagen(img.ruta)).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
    return { buffer, mime };
  }

  /** Marca/desmarca para el informe y/o cambia la leyenda. */
  async actualizar(
    id: number,
    cambios: { enInforme?: boolean; texto?: string },
  ) {
    const img = await this.imagen(id);
    await this.detalle(img.idDetalleOrden);
    await this.asegurarEditable(img.idDetalleOrden);

    if (cambios.texto !== undefined)
      img.texto = cambios.texto.trim().slice(0, 100) || null;

    if (
      cambios.enInforme === true &&
      img.estado !== EstadoActivoInactivo.ACTIVO
    ) {
      const seleccionadas = await this.paraInforme(img.idDetalleOrden);
      if (seleccionadas.length >= MAX_EN_INFORME) {
        throw new BadRequestException(
          `El informe admite máximo ${MAX_EN_INFORME} fotos. Quite una antes de agregar otra.`,
        );
      }
      img.estado = EstadoActivoInactivo.ACTIVO;
      img.ordenInforme =
        Math.max(0, ...seleccionadas.map((s, i) => s.ordenInforme ?? i + 1)) +
        1;
    } else if (cambios.enInforme === false) {
      img.estado = EstadoActivoInactivo.INACTIVO;
      img.ordenInforme = null;
    }
    await this.repo.save(img);
    if (cambios.enInforme === false) await this.renumerar(img.idDetalleOrden);
    return this.listar(img.idDetalleOrden);
  }

  /** Reordena las fotos del informe con la lista de IDs en el orden deseado. */
  async ordenar(idDetalleOrden: number, ids: number[]) {
    await this.detalle(idDetalleOrden);
    await this.asegurarEditable(idDetalleOrden);
    const filas = await this.repo.find({
      where: {
        idDetalleOrden,
        eliminada: false,
        estado: EstadoActivoInactivo.ACTIVO,
        id: In(ids),
      },
    });
    const pos = new Map(ids.map((id, i) => [id, i + 1]));
    for (const f of filas) f.ordenInforme = pos.get(f.id) ?? null;
    await this.repo.save(filas);
    await this.renumerar(idDetalleOrden);
    return this.listar(idDetalleOrden);
  }

  async eliminar(id: number) {
    const img = await this.imagen(id);
    await this.detalle(img.idDetalleOrden);
    await this.asegurarEditable(img.idDetalleOrden);
    img.eliminada = true;
    img.estado = EstadoActivoInactivo.INACTIVO;
    img.ordenInforme = null;
    await this.repo.save(img);
    await this.renumerar(img.idDetalleOrden);
    return this.listar(img.idDetalleOrden);
  }

  /** Deja las posiciones del informe en 1..n sin huecos. */
  private async renumerar(idDetalleOrden: number) {
    const sel = await this.paraInforme(idDetalleOrden);
    sel.forEach((s, i) => (s.ordenInforme = i + 1));
    if (sel.length) await this.repo.save(sel);
  }
}
