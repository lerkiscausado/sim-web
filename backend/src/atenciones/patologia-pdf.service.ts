import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import JSZip from 'jszip';
import { Patologia } from './entities/patologia.entity';
import { ImpresionPatologia } from './entities/impresion-patologia.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import { Especialistas } from '../seguridad/entities/especialistas.entity';
import {
  PDFDocument,
  LOGOS_DIR,
  registrarFuentes,
  FUENTES,
  u,
  pdfABuffer,
  fechaLarga,
  fechaCorta,
  edadAniosMeses,
  nombreArchivoSeguro,
  etiqueta,
} from '../reportes/pdf-utils';
import { renderHtml } from '../reportes/html-pdf';

/**
 * Variantes del informe de patología de la licencia 16 (CD Patología
 * Oncológica, rama `sandra` del VB.NET):
 * - CD          → Reportes/xrPatologiaCD        (sede por defecto: La Ermita)
 * - NUESTRA     → Reportes/xrPatologiaNuestra   (ordenes.ID_SEDE = 2)
 * - BOSQUE      → Reportes/xrPatologiaBosque    (ordenes.ID_SEDE = 3)
 * - PRELIMINAR  → Reportes/xrPatologiaCDPreliminar (estudio sin firmar)
 * Las cuatro comparten la misma lógica (AsignarDatos); cambian el logo, el
 * título y los textos fijos. Las coordenadas se toman del .Designer.vb.
 */
export type VarianteInforme = 'CD' | 'NUESTRA' | 'BOSQUE' | 'PRELIMINAR';

const LOGOS: Record<
  VarianteInforme,
  { archivo: string; x: number; y: number; w: number; h: number }
> = {
  CD: { archivo: 'la-ermita.png', x: 0, y: 0, w: 200, h: 100 },
  NUESTRA: { archivo: 'nuestra.png', x: 0, y: 0, w: 200, h: 100 },
  BOSQUE: { archivo: 'el-bosque.png', x: 0, y: 12.62, w: 200, h: 87.38 },
  PRELIMINAR: { archivo: 'dra-sandra.png', x: 1.89, y: 0, w: 90.57, h: 109.43 },
};

const NOTA =
  'Nota: el presente informe debe ser correlacionado con la clínica, imágenes y demás paraclínicos, para una mejor ' +
  'interpretación del diagnóstico por parte del médico tratante. Si hay discrepancia, favor solicitar revisión o ' +
  'aclaración al servicio de patología.';
const REALIZADO =
  'ESTUDIO REALIZADO POR CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA';
const ARCHIVO_LAMINAS =
  'El material correspondeinte a laminas y bloques de parafina del presente estudio histopatopatológico será ' +
  'archivado en nuestro laboratorio por un periodo de 5 años. El usuario que lo desee  podrá reclamarlos durante ese periodo.';

/** XrLabel33.Text de cada .resx. */
const TEXTO_LEGAL: Record<VarianteInforme, string> = {
  CD: `${NOTA} \n${REALIZADO}`,
  NUESTRA: `${ARCHIVO_LAMINAS}\n${NOTA} \n${REALIZADO}`,
  BOSQUE: `${NOTA} \n${REALIZADO}`,
  PRELIMINAR: `${NOTA} ${REALIZADO}`,
};

/** Márgenes del reporte: Margins(46, 50, 30, 27) en centésimas de pulgada. */
const M = { left: u(46), right: u(50), top: u(30), bottom: u(27) };
const ALTO = {
  reportHeader: u(102.92),
  pageHeader: u(168.85),
  pageFooter: u(27.36),
  reportFooter: u(90.94),
};
const GRIS = '#DCDCDC'; // Color.Gainsboro de los XrShape

@Injectable()
export class PatologiaPdfService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(ImpresionPatologia)
    private readonly impresionRepository: Repository<ImpresionPatologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(Especialistas)
    private readonly especialistasRepository: Repository<Especialistas>,
  ) {}

  /**
   * Equivalente a DImpresionPatologia.Eliminar()+Guardar(): arma la fila de
   * impresion_patologia con los datos vivos de la orden (mismo SELECT del
   * VB.NET) y la guarda. Si `regenerar` es false y ya existe, se reutiliza
   * (así un estudio firmado se sigue imprimiendo igual que cuando se firmó).
   */
  async prepararSnapshot(
    idOrden: number,
    regenerar: boolean,
  ): Promise<ImpresionPatologia> {
    if (!regenerar) {
      const existente = await this.impresionRepository.findOne({
        where: { idorden: idOrden },
      });
      if (existente) return existente;
    }

    const patologia = await this.patologiaRepository.findOne({
      where: { idOrden },
      relations: ['diagnosticoCie10'],
    });
    if (!patologia) {
      throw new NotFoundException(
        `No hay informe de patología para la orden ${idOrden}`,
      );
    }
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
      relations: [
        'paciente',
        'contrato',
        'contrato.entidad',
        'subentidad',
        'sede',
      ],
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);

    // `especialistas` se une por ID_ESPECIALISTA = patologia.ID_EMPLEADO (igual que el VB.NET).
    const especialista = await this.especialistasRepository.findOne({
      where: { idEspecialista: patologia.idEmpleado },
    });
    const p = orden.paciente;

    const fila = this.impresionRepository.create({
      idorden: orden.id,
      consecutivo: orden.consecutivo,
      fechaIngreso: orden.fechaIngreso,
      identificacion: p
        ? `${p.idTipoIdentificacion ?? ''}${p.identificacion ?? ''}`
        : '',
      nombre: p
        ? [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
            .map((x) => x ?? '')
            .join(' ')
        : '',
      edad: edadAniosMeses(p?.fechaNacimiento),
      sexo: p?.sexo ?? null,
      estadoCivil: p?.estadoCivil != null ? String(p.estadoCivil) : null,
      telefono: p?.telefono ?? '',
      direccion: orden.subentidad?.nombre ?? '',
      nombreEntidad: orden.contrato?.entidad?.nombreEntidad ?? '',
      tipoMuestra: patologia.tipoMuestra,
      sitioLesion: patologia.sitioLesion,
      solicitado: patologia.solicitado,
      descripcionMacroscopica: patologia.descripcionMacroscopica,
      descripcionMicroscopica: patologia.descripcionMicroscopica,
      diagnostico: patologia.diagnostico,
      observaciones: patologia.observaciones,
      codigoDiagnostico: patologia.codigoDiagnostico,
      nombreDiagnostico: patologia.diagnosticoCie10?.nombreDiagnostico ?? '',
      idLicencia: orden.contrato?.idLicencia ?? null,
      idEmpleado: patologia.idEmpleado,
      medico: especialista?.nombre ?? '',
      especialidad: especialista?.especialidad ?? '',
      registroMedico: especialista?.registroMedico ?? '',
      firma: especialista?.firma ?? null,
      fechaSalida: patologia.fechaSalida,
      sede: orden.sede?.direccion ?? '',
    });

    await this.impresionRepository.delete({ idorden: orden.id });
    return this.impresionRepository.save(fila);
  }

  /** ValidarSede(): elige el reporte según ordenes.ID_SEDE (2 Nuestra, 3 Bosque, resto CD). */
  varianteFinal(idSede: number | null | undefined): VarianteInforme {
    if (idSede === 2) return 'NUESTRA';
    if (idSede === 3) return 'BOSQUE';
    return 'CD';
  }

  /**
   * Genera el PDF del informe de una orden.
   * - variante 'auto': firmado (ATENDIDO/FACTURADO) → reporte de su sede;
   *   si no → preliminar (lo que hace frmConsultarCDPatologia/frmInicio con la licencia 16).
   */
  async generar(
    idOrden: number,
    opciones: {
      variante?: VarianteInforme | 'auto' | 'final';
      regenerar?: boolean;
    } = {},
  ): Promise<{
    buffer: Buffer;
    nombreArchivo: string;
    variante: VarianteInforme;
  }> {
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    const firmado =
      orden.estado === EstadoOrden.ATENDIDO ||
      orden.estado === EstadoOrden.FACTURADO;

    let variante: VarianteInforme;
    if (!opciones.variante || opciones.variante === 'auto') {
      variante = firmado ? this.varianteFinal(orden.idSede) : 'PRELIMINAR';
    } else if (opciones.variante === 'final') {
      variante = this.varianteFinal(orden.idSede);
    } else {
      variante = opciones.variante;
    }

    // Un estudio sin firmar puede cambiar en cualquier momento: siempre se reconstruye.
    const datos = await this.prepararSnapshot(
      idOrden,
      opciones.regenerar ?? !firmado,
    );
    const buffer = await this.dibujar(datos, variante);
    const nombreArchivo =
      nombreArchivoSeguro(
        `${datos.consecutivo ?? idOrden} - ${(datos.nombre ?? '').trim()} - ${datos.identificacion ?? ''}`,
      ) + '.pdf';
    return { buffer, nombreArchivo, variante };
  }

  /** Exportar Lote PDF (tsmExportarLotePDF): un PDF por orden, empaquetados en un ZIP. */
  async generarLote(
    ids: number[],
  ): Promise<{
    zip: Buffer;
    generados: number;
    omitidos: { idOrden: number; motivo: string }[];
  }> {
    const zip = new JSZip();
    const omitidos: { idOrden: number; motivo: string }[] = [];
    let generados = 0;
    const usados = new Set<string>();
    for (const id of ids) {
      try {
        const { buffer, nombreArchivo } = await this.generar(id);
        let nombre = nombreArchivo;
        for (let i = 2; usados.has(nombre); i++)
          nombre = nombreArchivo.replace(/\.pdf$/, ` (${i}).pdf`);
        usados.add(nombre);
        zip.file(nombre, buffer);
        generados++;
      } catch (err) {
        omitidos.push({
          idOrden: id,
          motivo: err instanceof Error ? err.message : 'Error al generar',
        });
      }
    }
    if (omitidos.length) {
      zip.file(
        '_omitidos.txt',
        omitidos.map((o) => `Orden ${o.idOrden}: ${o.motivo}`).join('\r\n'),
      );
    }
    return {
      zip: await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      }),
      generados,
      omitidos,
    };
  }

  // ───────────────────────────── dibujo ─────────────────────────────

  async dibujar(
    d: ImpresionPatologia,
    variante: VarianteInforme,
  ): Promise<Buffer> {
    const preliminar = variante === 'PRELIMINAR';
    const doc = new PDFDocument({
      size: 'LETTER',
      bufferPages: true,
      autoFirstPage: true,
      margins: {
        left: M.left,
        right: M.right,
        top: M.top + ALTO.pageHeader,
        bottom: M.bottom + ALTO.pageFooter,
      },
      info: {
        Title: `${d.consecutivo ?? ''} - ${(d.nombre ?? '').trim()} - ${d.identificacion ?? ''}`,
        Author: 'Ados Software',
        Creator: 'SIM - Sistema Integrado Medico',
      },
    });
    registrarFuentes(doc);
    const ancho = doc.page.width - M.left - M.right;
    const X = (c: number) => M.left + u(c);

    // ===== Detail: xrDiagnostico (HTML) + XrLabel33 (texto legal) =====
    doc.y = M.top + ALTO.reportHeader + ALTO.pageHeader;
    renderHtml(doc, d.diagnostico ?? '', X(1.83), u(738.74), {
      familia: 'arial',
      tamano: 9.75,
      bold: variante === 'CD',
    });
    doc.y += u(preliminar ? 20 : 6);
    doc.font(FUENTES.calibriItalic).fontSize(8).fillColor('black');
    doc.text(TEXTO_LEGAL[variante], X(0), doc.y, {
      width: u(740.94),
      align: 'left',
    });

    // ===== ReportFooter: firma + médico (solo al final del reporte) =====
    const altoFooter = preliminar ? u(122) : ALTO.reportFooter;
    if (doc.y + altoFooter > doc.page.height - doc.page.margins.bottom)
      doc.addPage();
    const yF = doc.y;
    const offFirma = preliminar ? 31.31 : 0;
    if (d.firma && d.firma.length > 0) {
      try {
        doc.image(d.firma, X(42.4), yF + u(10 + offFirma), {
          fit: [u(76.91), u(36.15)],
          align: 'center',
          valign: 'center',
        });
      } catch {
        // firma no es una imagen válida: se deja el espacio
      }
    }
    const yMedico = yF + u(38.15 + offFirma);
    doc
      .moveTo(X(10), yMedico)
      .lineTo(X(10 + 210.38), yMedico)
      .lineWidth(0.75)
      .strokeColor('black')
      .stroke();
    doc
      .font(FUENTES.calibriBold)
      .fontSize(9)
      .text((d.medico ?? '').trim(), X(10) + 1.5, yMedico + 1.5, {
        width: u(210.38),
        lineBreak: false,
      });
    doc.font(FUENTES.calibri).fontSize(8);
    doc.text(
      (d.especialidad ?? '').trim(),
      X(10) + 1.5,
      yF + u(55.69 + offFirma) + 1.5,
      { width: u(255.3), lineBreak: false },
    );
    doc.text(
      (d.registroMedico ?? '').trim(),
      X(10) + 1.5,
      yF + u(68.69 + offFirma) + 1.5,
      { width: u(397.94) },
    );

    // ===== Bandas que se repiten: se dibujan al final para conocer el total de páginas =====
    const rango = doc.bufferedPageRange();
    const total = rango.count;
    for (let i = rango.start; i < rango.start + total; i++) {
      doc.switchToPage(i);
      const margenAbajo = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; // permite escribir en la zona del pie sin saltar de página
      let y0 = M.top;
      if (i === rango.start) {
        this.reportHeader(doc, d, variante, X, y0);
        y0 += ALTO.reportHeader;
      }
      this.pageHeader(doc, d, variante, X, y0, i - rango.start + 1, total);
      this.pageFooter(
        doc,
        d,
        X,
        doc.page.height - M.bottom - ALTO.pageFooter,
        ancho,
      );
      doc.page.margins.bottom = margenAbajo;
    }
    return pdfABuffer(doc);
  }

  private reportHeader(
    doc: PDFKit.PDFDocument,
    d: ImpresionPatologia,
    v: VarianteInforme,
    X: (c: number) => number,
    y0: number,
  ) {
    const Y = (c: number) => y0 + u(c);
    const logo = LOGOS[v];
    try {
      doc.image(path.join(LOGOS_DIR, logo.archivo), X(logo.x), Y(logo.y), {
        width: u(logo.w),
        height: u(logo.h),
      });
    } catch {
      // sin logo
    }
    etiqueta(doc, 'Fecha Impresión', X(659.81), Y(0), u(93.08), {
      bold: true,
      size: 8,
      align: 'right',
    });
    etiqueta(doc, fechaLarga(), X(582.3), Y(12.62), u(170.59), {
      size: 8,
      align: 'right',
    });
    const entidad = `LABORATORIO DE PATOLOGIA ${d.nombreEntidad ?? ''}`.trim();
    if (v === 'PRELIMINAR') {
      etiqueta(
        doc,
        'CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGIA ONCOLOGICA',
        X(0),
        Y(35.62),
        u(744),
        { bold: true, size: 14, align: 'center' },
      );
      etiqueta(doc, entidad, X(0), Y(63.23), u(754), {
        size: 13,
        align: 'center',
      });
    } else {
      etiqueta(
        doc,
        entidad,
        X(0),
        Y(v === 'CD' ? 36.62 : 35.62),
        u(v === 'CD' ? 744.94 : 754),
        { bold: true, size: 13, align: 'center' },
      );
    }
  }

  private pageHeader(
    doc: PDFKit.PDFDocument,
    d: ImpresionPatologia,
    v: VarianteInforme,
    X: (c: number) => number,
    y0: number,
    pagina: number,
    total: number,
  ) {
    const Y = (c: number) => y0 + u(c);
    const pre = v === 'PRELIMINAR';
    const redondeado = (x: number, y: number, w: number, h: number) =>
      doc
        .roundedRect(X(x) + 1, Y(y) + 1, u(w) - 2, u(h) - 2, 6)
        .lineWidth(1)
        .strokeColor(GRIS)
        .stroke();

    // Marcos (XrShape1/2/3)
    redondeado(0, 0, 578.3, 70.57);
    redondeado(582.68, 17.62, 162.26, 50.81);
    redondeado(2, 73.43, 741, 56.57);
    doc.strokeColor('black');

    // Consecutivo grande arriba a la derecha + "Estudio No:"
    if (v === 'CD')
      etiqueta(doc, d.consecutivo ?? '', X(651.87), Y(0), u(93.08), {
        bold: true,
        size: 13,
        align: 'right',
      });
    else
      etiqueta(doc, d.consecutivo ?? '', X(644.94), Y(0), u(100), {
        bold: true,
        size: 13,
        align: 'right',
      });
    etiqueta(doc, 'Estudio No:', X(582.3), Y(5), u(62.64), { size: 8 });

    // XrPanel2: fechas y página
    const px = 582.3;
    const py = 21;
    etiqueta(doc, 'Fecha Ingreso:', X(px + 6), Y(py + 2), u(69.25), {
      size: 8,
    });
    etiqueta(
      doc,
      fechaCorta(d.fechaIngreso),
      X(px + 75.25),
      Y(py + 2),
      u(83.02),
      { size: 8, align: 'right' },
    );
    etiqueta(doc, 'Fecha Salida:', X(px + 6), Y(py + 15), u(69.25), {
      size: 8,
    });
    etiqueta(
      doc,
      fechaCorta(d.fechaSalida),
      X(px + 75.25),
      Y(py + 15),
      u(83.02),
      { size: 8, align: 'right' },
    );
    etiqueta(doc, 'No. de Página:', X(px + 6), Y(py + 28), u(69.25), {
      size: 8,
    });
    etiqueta(doc, `${pagina} / ${total}`, X(px + 75.25), Y(py + 28), u(83.02), {
      size: 8,
      align: 'right',
    });

    // XrPanel1: datos del paciente
    etiqueta(doc, 'Nombre:', X(7), Y(6), u(92.83), { bold: true });
    etiqueta(doc, d.nombre ?? '', X(99.83), Y(6), u(363.21), { bold: !pre });
    etiqueta(doc, 'Identificacion:', X(7), Y(23), u(92.83), { bold: true });
    etiqueta(doc, d.identificacion ?? '', X(99.83), Y(23), u(100));
    etiqueta(doc, 'Edad:', X(199.83), Y(23), u(45.66), { bold: true });
    etiqueta(doc, d.edad ?? '', X(265.3), Y(23), u(118.87));
    etiqueta(doc, 'Sexo:', X(422.64), Y(23), u(45.66), { bold: true });
    etiqueta(doc, d.sexo ?? '', X(468.3), Y(23), u(100));
    etiqueta(doc, 'Telefono:', X(7), Y(41.62), u(92.83), { bold: true });
    etiqueta(doc, d.telefono ?? '', X(99.83), Y(41.62), u(100));
    etiqueta(
      doc,
      pre ? 'Direccion:' : 'Entidad:',
      X(199.83),
      Y(41.62),
      u(65.47),
      { bold: true },
    );
    etiqueta(doc, d.direccion ?? '', X(265.3), Y(41.62), u(303));

    // XrShape3: datos del estudio
    etiqueta(doc, pre ? 'Entidad:' : 'Atendido en:', X(9), Y(76), u(92.83), {
      bold: true,
    });
    etiqueta(doc, d.nombreEntidad ?? '', X(101.83), Y(76), u(350));
    etiqueta(doc, 'Remitente Dr(a):', X(451.83), Y(76), u(107.96), {
      bold: true,
    });
    etiqueta(doc, d.solicitado ?? '', X(559.79), Y(76), u(163.21));
    etiqueta(doc, 'Espécimen:', X(9), Y(93), u(92.83), { bold: true });
    etiqueta(doc, d.tipoMuestra ?? '', X(102.83), Y(93), u(620.17));
    etiqueta(doc, 'Impresión Diagnostica:', X(9), Y(110), u(135.11), {
      bold: true,
    });
    etiqueta(
      doc,
      d.descripcionMacroscopica ?? '',
      X(143.49),
      Y(110),
      u(579.51),
    );

    // XrLine1 (granate, grosor 4) y título del informe
    doc
      .moveTo(X(10), Y(137.46))
      .lineTo(X(723), Y(137.46))
      .lineWidth(u(4))
      .strokeColor('#800000')
      .stroke();
    doc.strokeColor('black').lineWidth(1);
    const titulo = pre
      ? `INFORME PRELIMINAR ANATOMOPATOLOGICO No. ${d.consecutivo ?? ''}`
      : `INFORME ANATOMOPATOLOGICO No.${d.consecutivo ?? ''}`;
    etiqueta(doc, titulo, X(2), Y(144.92), u(738.94), {
      bold: true,
      size: 12,
      align: 'center',
    });
  }

  private pageFooter(
    doc: PDFKit.PDFDocument,
    d: ImpresionPatologia,
    X: (c: number) => number,
    y0: number,
    ancho: number,
  ) {
    doc
      .moveTo(X(0), y0)
      .lineTo(X(0) + Math.min(u(743), ancho), y0)
      .lineWidth(0.75)
      .strokeColor('black')
      .stroke();
    doc.font(FUENTES.calibri).fontSize(8).fillColor('black');
    doc.text(d.sede ?? '', X(0) + u(2), y0 + 1.5, {
      width: Math.min(u(743), ancho) - u(4),
      align: 'center',
      height: ALTO.pageFooter - 2,
      ellipsis: true,
    });
  }
}
