import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import ExcelJS from 'exceljs';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import { EntregaResultados } from '../atenciones/entities/entrega-resultados.entity';
import { Patologia } from '../atenciones/entities/patologia.entity';
import { Citologia } from '../atenciones/entities/citologia.entity';
import { PatologiaPdfService } from '../atenciones/patologia-pdf.service';
import { CitologiaPdfService } from '../atenciones/citologia-pdf.service';
import { tablaPdf, ColumnaTabla } from '../reportes/tabla-pdf';
import { fechaCorta, nombreArchivoSeguro } from '../reportes/pdf-utils';
import { reciboEntregaPdf } from './recibo-entrega-pdf';
import JSZip from 'jszip';
import { aISOLocal } from '../common/registros.util';

export interface FiltrosConsulta {
  anio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  q?: string;
  estado?: string;
  idSede?: number;
  idTipoEstudio?: number;
}

/** Fila de la grilla de frmConsultarCDPatologia (mismas columnas de DOrdenes.OrdenesCDPatologia). */
export interface FilaConsulta {
  orden: number;
  consecutivo: string;
  fechaIngreso: string;
  identificacion: string;
  nombre: string;
  sexo: string;
  edad: number | null;
  telefono: string;
  correo: string;
  contrato: string;
  entidad: string;
  estudio: string;
  prefijo: string;
  comentarios: string;
  estado: string;
  especimen: string;
  sede: string;
  idSede: number;
  subentidad: string;
  idUsuario: number;
}

const PREFIJOS_CITOLOGIA = ['CV', 'CB', 'CR'];

export const COLUMNAS_CONSULTA: (ColumnaTabla & { excel: number })[] = [
  { titulo: 'ORDEN', campo: 'orden', ancho: 0.6, excel: 9 },
  { titulo: 'CONSECUTIVO', campo: 'consecutivo', ancho: 0.9, excel: 13 },
  {
    titulo: 'FECHA INGRESO',
    campo: 'fechaIngresoTexto',
    ancho: 0.8,
    excel: 13,
  },
  { titulo: 'IDENTIFICACION', campo: 'identificacion', ancho: 1, excel: 16 },
  { titulo: 'NOMBRE', campo: 'nombre', ancho: 2.2, excel: 34 },
  { titulo: 'SEXO', campo: 'sexo', ancho: 0.4, excel: 6 },
  { titulo: 'EDAD', campo: 'edad', ancho: 0.4, excel: 6 },
  { titulo: 'TELEFONO', campo: 'telefono', ancho: 0.9, excel: 13 },
  { titulo: 'CORREO', campo: 'correo', ancho: 1.5, excel: 28 },
  { titulo: 'ENTIDAD', campo: 'entidad', ancho: 1.4, excel: 26 },
  { titulo: 'SUB ENTIDAD', campo: 'subentidad', ancho: 1.3, excel: 24 },
  { titulo: 'ESTUDIO', campo: 'estudio', ancho: 1, excel: 18 },
  { titulo: 'ESPECIMEN', campo: 'especimen', ancho: 1.6, excel: 30 },
  { titulo: 'SEDE', campo: 'sede', ancho: 0.8, excel: 13 },
  { titulo: 'COMENTARIOS', campo: 'comentarios', ancho: 1.3, excel: 30 },
  { titulo: 'ESTADO', campo: 'estado', ancho: 0.8, excel: 12 },
];

@Injectable()
export class ConsultaOrdenesService {
  constructor(
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(EntregaResultados)
    private readonly entregaRepository: Repository<EntregaResultados>,
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(Citologia)
    private readonly citologiaRepository: Repository<Citologia>,
    private readonly dataSource: DataSource,
    private readonly patologiaPdf: PatologiaPdfService,
    private readonly citologiaPdf: CitologiaPdfService,
  ) {}

  /** DOrdenes.OrdenesCDPatologia(): misma consulta, con filtros y paginación. */
  private base(f: FiltrosConsulta): SelectQueryBuilder<Ordenes> {
    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoin('o.paciente', 'u')
      .leftJoin('o.contrato', 'c')
      .leftJoin('c.entidad', 'e')
      .leftJoin('o.tipoEstudio', 't')
      .leftJoin('o.especimen', 'esp')
      .leftJoin('o.sede', 's')
      .leftJoin('o.subentidad', 'sub');
    if (f.anio) qb.andWhere('YEAR(o.fechaIngreso) = :anio', { anio: f.anio });
    if (f.fechaInicio)
      qb.andWhere('o.fechaIngreso >= :fi', { fi: f.fechaInicio });
    if (f.fechaFin) qb.andWhere('o.fechaIngreso <= :ff', { ff: f.fechaFin });
    if (f.estado) qb.andWhere('o.estado = :estado', { estado: f.estado });
    if (f.idSede) qb.andWhere('o.idSede = :idSede', { idSede: f.idSede });
    if (f.idTipoEstudio)
      qb.andWhere('o.idTipoEstudio = :tipo', { tipo: f.idTipoEstudio });
    if (f.q && f.q.trim()) {
      const palabras = f.q.trim().split(/\s+/).slice(0, 5);
      palabras.forEach((p, i) => {
        qb.andWhere(
          new Brackets((w) => {
            const k = `t${i}`;
            w.where(`o.consecutivo LIKE :${k}`, { [k]: `%${p}%` })
              .orWhere(`o.numeroOrden LIKE :${k}`)
              .orWhere(`u.identificacion LIKE :${k}`)
              .orWhere(`u.primerNombre LIKE :${k}`)
              .orWhere(`u.segundoNombre LIKE :${k}`)
              .orWhere(`u.primerApellido LIKE :${k}`)
              .orWhere(`u.segundoApellido LIKE :${k}`)
              .orWhere(`esp.nombre LIKE :${k}`)
              .orWhere(`sub.nombre LIKE :${k}`);
            if (/^\d+$/.test(p))
              w.orWhere(`o.id = :${k}id`, { [`${k}id`]: Number(p) });
          }),
        );
      });
    }
    return qb;
  }

  private seleccionar(qb: SelectQueryBuilder<Ordenes>) {
    return qb
      .select([
        'o.id AS orden',
        'o.consecutivo AS consecutivo',
        'o.fechaIngreso AS fechaIngreso',
        "CONCAT(IFNULL(u.idTipoIdentificacion,''), IFNULL(u.identificacion,'')) AS identificacion",
        "TRIM(CONCAT_WS(' ', u.primerNombre, u.segundoNombre, u.primerApellido, u.segundoApellido)) AS nombre",
        'u.sexo AS sexo',
        'TIMESTAMPDIFF(YEAR, u.fechaNacimiento, CURDATE()) AS edad',
        'u.telefono AS telefono',
        'u.correoElectronico AS correo',
        'c.nombre AS contrato',
        'e.nombreEntidad AS entidad',
        't.nombreTipoEstudio AS estudio',
        't.prefijo AS prefijo',
        'o.comentarios AS comentarios',
        'o.estado AS estado',
        'esp.nombre AS especimen',
        's.nombre AS sede',
        'o.idSede AS idSede',
        'sub.nombre AS subentidad',
        'o.idUsuario AS idUsuario',
      ])
      .orderBy('o.fechaIngreso', 'DESC')
      .addOrderBy('o.id', 'DESC');
  }

  private normalizar(r: Record<string, unknown>): FilaConsulta {
    const fecha =
      r.fechaIngreso instanceof Date
        ? aISOLocal(r.fechaIngreso)
        : String(r.fechaIngreso ?? '').slice(0, 10);
    return {
      orden: Number(r.orden),
      consecutivo: String(r.consecutivo ?? '').trim(),
      fechaIngreso: fecha,
      identificacion: String(r.identificacion ?? '').trim(),
      nombre: String(r.nombre ?? '')
        .replace(/\s+/g, ' ')
        .trim(),
      sexo: String(r.sexo ?? ''),
      edad: r.edad === null || r.edad === undefined ? null : Number(r.edad),
      telefono: String(r.telefono ?? '').trim(),
      correo: String(r.correo ?? '').trim(),
      contrato: String(r.contrato ?? '').trim(),
      entidad: String(r.entidad ?? '').trim(),
      estudio: String(r.estudio ?? '').trim(),
      prefijo: String(r.prefijo ?? '').trim(),
      comentarios: String(r.comentarios ?? '').trim(),
      estado: String(r.estado ?? ''),
      especimen: String(r.especimen ?? '').trim(),
      sede: String(r.sede ?? '').trim(),
      idSede: Number(r.idSede ?? 0),
      subentidad: String(r.subentidad ?? '').trim(),
      idUsuario: Number(r.idUsuario ?? 0),
    };
  }

  async listar(f: FiltrosConsulta, page = 1, pageSize = 50) {
    const take = Math.min(Math.max(pageSize, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const total = await this.base(f).getCount();
    const filas = await this.seleccionar(this.base(f))
      .offset(skip)
      .limit(take)
      .getRawMany();
    return {
      data: filas.map((r) => this.normalizar(r)),
      total,
      page: Math.max(page, 1),
      pageSize: take,
    };
  }

  /** Todas las filas filtradas (para exportar). Tope de seguridad de 50.000. */
  async todas(f: FiltrosConsulta, tope = 50000): Promise<FilaConsulta[]> {
    const filas = await this.seleccionar(this.base(f)).limit(tope).getRawMany();
    return filas.map((r) => this.normalizar(r));
  }

  async aniosDisponibles(): Promise<number[]> {
    const rows = await this.dataSource.query(
      'SELECT DISTINCT YEAR(FECHA_INGRESO) AS anio FROM ordenes WHERE FECHA_INGRESO IS NOT NULL ORDER BY anio DESC',
    );
    return rows.map((r: { anio: number }) => Number(r.anio)).filter(Boolean);
  }

  private descripcionFiltros(f: FiltrosConsulta) {
    const partes: string[] = [];
    if (f.anio) partes.push(`Año ${f.anio}`);
    if (f.fechaInicio || f.fechaFin)
      partes.push(
        `Del ${fechaCorta(f.fechaInicio) || '…'} al ${fechaCorta(f.fechaFin) || '…'}`,
      );
    if (f.estado) partes.push(`Estado ${f.estado}`);
    if (f.q) partes.push(`Búsqueda "${f.q}"`);
    return partes.join(' · ') || 'Todas las órdenes';
  }

  /** tsmExportarExcel: GCConsultar.ExportToXls. */
  async exportarExcel(f: FiltrosConsulta): Promise<Buffer> {
    const filas = await this.todas(f);
    const libro = new ExcelJS.Workbook();
    libro.creator = 'SIM - Sistema Integrado Medico';
    const hoja = libro.addWorksheet('Ordenes', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    hoja.columns = COLUMNAS_CONSULTA.map((c) => ({
      header: c.titulo,
      key: c.campo,
      width: c.excel,
    }));
    for (const fila of filas) {
      hoja.addRow({
        ...fila,
        fechaIngresoTexto: fila.fechaIngreso
          ? new Date(`${fila.fechaIngreso}T00:00:00`)
          : null,
      });
    }
    hoja.getColumn('fechaIngresoTexto').numFmt = 'dd/mm/yyyy';
    const cab = hoja.getRow(1);
    cab.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cab.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF7A1F1F' },
    };
    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNAS_CONSULTA.length },
    };
    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  /** tsmExportarPDF / tsmImprimir: la grilla en PDF. */
  async exportarPdf(f: FiltrosConsulta): Promise<Buffer> {
    const filas = await this.todas(f, 5000);
    return tablaPdf({
      titulo: 'CONSULTA DE ÓRDENES',
      subtitulo:
        this.descripcionFiltros(f) +
        (filas.length >= 5000 ? ' (primeras 5.000)' : ''),
      columnas: COLUMNAS_CONSULTA.filter(
        (c) => !['orden', 'correo', 'telefono'].includes(c.campo),
      ),
      filas: filas.map((r) => ({
        ...r,
        fechaIngresoTexto: fechaCorta(r.fechaIngreso),
      })),
    });
  }

  /** Ids para "Exportar lote PDF": órdenes filtradas que tienen informe. */
  async idsParaLote(f: FiltrosConsulta, tope = 300): Promise<number[]> {
    const filas = await this.todas(f, tope);
    return filas.map((r) => r.orden);
  }

  private async esCitologia(idOrden: number): Promise<boolean> {
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
      relations: ['tipoEstudio'],
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    if (
      PREFIJOS_CITOLOGIA.includes((orden.tipoEstudio?.prefijo ?? '').trim())
    ) {
      const hayCito = await this.citologiaRepository.exist({
        where: { idOrden },
      });
      if (hayCito) return true;
      const hayPato = await this.patologiaRepository.exist({
        where: { idOrden },
      });
      return !hayPato;
    }
    return false;
  }

  /** Reporte de estudios (bbiReporteEstudios): firmado → informe de su sede; si no → preliminar. */
  async pdfEstudio(
    idOrden: number,
    variante?: string,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    if (await this.esCitologia(idOrden))
      return this.citologiaPdf.generar(idOrden);
    const r = await this.patologiaPdf.generar(idOrden, {
      variante: (variante as 'auto') ?? 'auto',
    });
    return { buffer: r.buffer, nombreArchivo: r.nombreArchivo };
  }

  /** Exportar Lote PDF: un PDF por orden dentro de un ZIP. */
  async lote(ids: number[]) {
    const unicos = [
      ...new Set(ids.map(Number).filter((n) => Number.isInteger(n) && n > 0)),
    ];
    if (unicos.length === 0)
      throw new BadRequestException('No hay órdenes para exportar');
    if (unicos.length > 300)
      throw new BadRequestException(
        'Máximo 300 órdenes por lote; afine los filtros',
      );
    const patologia: number[] = [];
    const citologia: number[] = [];
    for (const id of unicos)
      ((await this.esCitologia(id).catch(() => false))
        ? citologia
        : patologia
      ).push(id);
    const r = await this.patologiaPdf.generarLote(patologia);
    if (citologia.length) {
      const zip = await JSZip.loadAsync(r.zip);
      for (const id of citologia) {
        try {
          const c = await this.citologiaPdf.generar(id);
          zip.file(c.nombreArchivo, c.buffer);
          r.generados++;
        } catch (e) {
          r.omitidos.push({
            idOrden: id,
            motivo: e instanceof Error ? e.message : 'Error',
          });
        }
      }
      if (r.omitidos.length)
        zip.file(
          '_omitidos.txt',
          r.omitidos.map((o) => `Orden ${o.idOrden}: ${o.motivo}`).join('\r\n'),
        );
      r.zip = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });
    }
    return r;
  }

  /** bbiEntregaResultados: recibo de entrega de resultados de la orden. */
  async reciboEntrega(
    idOrden: number,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const entrega = await this.entregaRepository.findOne({
      where: { idOrden },
    });
    if (!entrega)
      throw new NotFoundException('No existe recibo para esta orden');
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
      relations: [
        'paciente',
        'contrato',
        'contrato.entidad',
        'tipoEstudio',
        'sede',
        'especimen',
        'subentidad',
      ],
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    const buffer = await reciboEntregaPdf(orden, entrega);
    return {
      buffer,
      nombreArchivo:
        nombreArchivoSeguro(`Recibo entrega ${orden.consecutivo}`) + '.pdf',
    };
  }

  /** bbiRelacionPatologias: relación de estudios ingresados en una fecha (rptRelacionPatologias). */
  async relacionPatologias(fecha: string): Promise<Buffer> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha))
      throw new BadRequestException('Debe Seleccionar una Fecha');
    const filas = await this.todas(
      { fechaInicio: fecha, fechaFin: fecha },
      5000,
    );
    const activas = filas
      .filter((r) => r.estado !== EstadoOrden.CANCELADO)
      .reverse();
    return tablaPdf({
      titulo: 'RELACIÓN DE PATOLOGÍAS',
      subtitulo: `Fecha de ingreso: ${fechaCorta(fecha)}`,
      columnas: [
        { titulo: 'No.', campo: 'n', ancho: 0.35, align: 'right' },
        { titulo: 'CONSECUTIVO', campo: 'consecutivo', ancho: 0.9 },
        { titulo: 'IDENTIFICACION', campo: 'identificacion', ancho: 1 },
        { titulo: 'PACIENTE', campo: 'nombre', ancho: 2.2 },
        { titulo: 'EDAD', campo: 'edad', ancho: 0.4, align: 'center' },
        { titulo: 'ENTIDAD', campo: 'entidad', ancho: 1.4 },
        { titulo: 'SUB ENTIDAD', campo: 'subentidad', ancho: 1.3 },
        { titulo: 'ESTUDIO', campo: 'estudio', ancho: 0.9 },
        { titulo: 'ESPECIMEN', campo: 'especimen', ancho: 1.8 },
        { titulo: 'SEDE', campo: 'sede', ancho: 0.8 },
        { titulo: 'ESTADO', campo: 'estado', ancho: 0.8 },
      ],
      filas: activas.map((r, i) => ({ ...r, n: i + 1 })),
      pie: 'CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA',
    });
  }
}
