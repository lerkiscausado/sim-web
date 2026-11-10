import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import { Citologia } from './entities/citologia.entity';
import { TomaMuestra } from './entities/toma-muestra.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import { Especialistas } from '../seguridad/entities/especialistas.entity';
import { GRUPOS_CITOLOGIA, aApi } from './citologia-campos';
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

const M = { left: u(46), right: u(50), top: u(30), bottom: u(27) };
const GRIS = '#DCDCDC';
const LOGO_SEDE: Record<number, { archivo: string; w: number; h: number }> = {
  2: { archivo: 'nuestra.png', w: 200, h: 100 },
  3: { archivo: 'el-bosque.png', w: 200, h: 87.38 },
};
const LOGO_DEFECTO = { archivo: 'la-ermita.png', w: 200, h: 100 };

/**
 * Informe de citología cervicovaginal. Para la licencia 16 el VB.NET no tiene
 * un reporte propio (Funciones.GenerarPDF no contempla la licencia 16 y la
 * impresión pasa por los reportes de patología), así que se diseña con el
 * mismo marco visual del informe de patología de la sede: logo, recuadro
 * del paciente, datos del estudio, resultados por grupo (sistema Bethesda,
 * mismos rótulos de frmCitologiaGeneral) y firma del especialista.
 */
@Injectable()
export class CitologiaPdfService {
  constructor(
    @InjectRepository(Citologia)
    private readonly citologiaRepository: Repository<Citologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(Especialistas)
    private readonly especialistasRepository: Repository<Especialistas>,
    @InjectRepository(TomaMuestra)
    private readonly tomaMuestraRepository: Repository<TomaMuestra>,
  ) {}

  async generar(
    idOrden: number,
  ): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const c = await this.citologiaRepository.findOne({ where: { idOrden } });
    if (!c)
      throw new NotFoundException(
        `No hay informe de citología para la orden ${idOrden}`,
      );
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
      relations: [
        'paciente',
        'contrato',
        'contrato.entidad',
        'subentidad',
        'sede',
        'tipoEstudio',
      ],
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    const especialista = await this.especialistasRepository.findOne({
      where: { idEspecialista: c.idEmpleado },
    });
    const antecedentes = await this.tomaMuestraRepository.findOne({
      where: { idUsuario: orden.idUsuario },
    });
    const firmado =
      orden.estado === EstadoOrden.ATENDIDO ||
      orden.estado === EstadoOrden.FACTURADO;

    const p = orden.paciente;
    const nombre = p
      ? [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
          .filter(Boolean)
          .join(' ')
      : '';
    const identificacion = p
      ? `${p.idTipoIdentificacion ?? ''}${p.identificacion ?? ''}`
      : '';
    const entidad = orden.contrato?.entidad?.nombreEntidad ?? '';

    const doc = new PDFDocument({
      size: 'LETTER',
      bufferPages: true,
      margins: {
        left: M.left,
        right: M.right,
        top: M.top + u(150),
        bottom: M.bottom + u(27),
      },
      info: {
        Title: `${orden.consecutivo} - ${nombre} - ${identificacion}`,
        Author: 'Ados Software',
        Creator: 'SIM - Sistema Integrado Medico',
      },
    });
    registrarFuentes(doc);
    const X = (cc: number) => M.left + u(cc);
    const ancho = u(741);

    // ===== Cuerpo =====
    doc.y = M.top + u(102.92) + u(150);
    const seccion = (titulo: string) => {
      if (doc.y + 40 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      doc.moveDown(0.3);
      doc.rect(X(0), doc.y, ancho, 14).fill('#F2F2F2');
      doc
        .fillColor('black')
        .font(FUENTES.calibriBold)
        .fontSize(9.5)
        .text(titulo, X(4), doc.y + 2.5, { width: ancho - 8 });
      doc.y += 2;
    };

    if (antecedentes) {
      seccion('ANTECEDENTES');
      const a = antecedentes as unknown as Record<string, string | null>;
      const fila = [
        ['G', a.g],
        ['P', a.p],
        ['A', a.a],
        ['C', a.c],
        ['IVSA', a.ivsa],
        ['MPF', a.mpf],
        ['FUM', a.fum],
        ['FUC', a.fuc],
        ['FUP', a.fup],
      ]
        .filter(([, v]) => v && String(v).trim())
        .map(([k, v]) => `${k}: ${String(v).trim()}`)
        .join('    ');
      const cuello = [
        ['s', 'Sano'],
        ['u', 'Ulcerado'],
        ['l', 'Lacerado'],
      ]
        .filter(([k]) => aApi(a[k]) === '1')
        .map(([, l]) => l);
      const flujo = [
        ['bn', 'Blanco'],
        ['cn', 'Claro'],
        ['ba', 'Amarillo'],
        ['o', 'Con Olor'],
      ]
        .filter(([k]) => aApi(a[k]) === '1')
        .map(([, l]) => l);
      doc.font(FUENTES.calibri).fontSize(9.5);
      if (fila) doc.text(fila, X(6), doc.y + 2, { width: ancho - 12 });
      if (cuello.length)
        doc.text(`Cuello: ${cuello.join(', ')}`, X(6), doc.y, {
          width: ancho - 12,
        });
      if (flujo.length)
        doc.text(`Flujo: ${flujo.join(', ')}`, X(6), doc.y, {
          width: ancho - 12,
        });
      if (a.observaciones?.trim())
        doc.text(`Observaciones: ${a.observaciones.trim()}`, X(6), doc.y, {
          width: ancho - 12,
        });
    }

    const valores = c as unknown as Record<string, string | null>;
    let tituloPrevio = '';
    for (const g of GRUPOS_CITOLOGIA) {
      const marcados = g.campos.filter((f) => aApi(valores[f.key]) === '1');
      const esCalidad = g.titulo === 'CALIDAD DE LA MUESTRA';
      if (marcados.length === 0 && !(esCalidad && valores.cm5?.trim()))
        continue;
      if (g.titulo !== tituloPrevio) seccion(g.titulo);
      tituloPrevio = g.titulo;
      if (g.subtitulo) {
        doc
          .font(FUENTES.calibriBoldItalic)
          .fontSize(9)
          .text(g.subtitulo, X(10), doc.y + 2, { width: ancho - 20 });
      }
      doc.font(FUENTES.calibri).fontSize(9.5);
      for (const f of marcados) {
        const yy = doc.y + 1.5;
        doc
          .rect(X(14), yy + 1.5, 7, 7)
          .lineWidth(0.6)
          .stroke();
        doc
          .moveTo(X(14) + 1.2, yy + 2.7)
          .lineTo(X(14) + 5.8, yy + 7.3)
          .moveTo(X(14) + 5.8, yy + 2.7)
          .lineTo(X(14) + 1.2, yy + 7.3)
          .stroke();
        doc.text(f.label, X(14) + 12, yy, { width: ancho - 40 });
      }
      if (esCalidad && valores.cm5?.trim())
        doc.text(`Motivo: ${valores.cm5.trim()}`, X(14), doc.y + 1.5, {
          width: ancho - 28,
        });
    }

    if (c.observaciones?.trim()) {
      seccion('OBSERVACIONES');
      doc
        .font(FUENTES.calibri)
        .fontSize(9.5)
        .text(c.observaciones.trim(), X(6), doc.y + 2, {
          width: ancho - 12,
          align: 'justify',
        });
    }
    seccion('DIAGNÓSTICO');
    doc
      .font(FUENTES.arialBold)
      .fontSize(9.75)
      .text((c.diagnostico ?? '').trim() || '—', X(6), doc.y + 2, {
        width: ancho - 12,
        align: 'justify',
      });

    doc.moveDown(1);
    doc
      .font(FUENTES.calibriItalic)
      .fontSize(8)
      .text(
        'Nota: el presente informe debe ser correlacionado con la clínica, imágenes y demás paraclínicos, para una mejor ' +
          'interpretación del diagnóstico por parte del médico tratante. Si hay discrepancia, favor solicitar revisión o ' +
          'aclaración al servicio de patología.\nESTUDIO REALIZADO POR CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA',
        X(0),
        doc.y,
        { width: ancho },
      );

    // ===== Firma =====
    if (doc.y + u(95) > doc.page.height - doc.page.margins.bottom)
      doc.addPage();
    const yF = doc.y + u(4);
    if (firmado && especialista?.firma?.length) {
      try {
        doc.image(especialista.firma, X(42.4), yF + u(10), {
          fit: [u(76.91), u(36.15)],
          align: 'center',
          valign: 'center',
        });
      } catch {
        // firma inválida
      }
    }
    const yMed = yF + u(48);
    doc
      .moveTo(X(10), yMed)
      .lineTo(X(220), yMed)
      .lineWidth(0.75)
      .strokeColor('black')
      .stroke();
    doc
      .font(FUENTES.calibriBold)
      .fontSize(9)
      .text(especialista?.nombre ?? '', X(11), yMed + 1.5, {
        width: u(300),
        lineBreak: false,
      });
    doc
      .font(FUENTES.calibri)
      .fontSize(8)
      .text(especialista?.especialidad ?? '', X(11), yMed + u(18), {
        width: u(400),
        lineBreak: false,
      });
    doc.text(especialista?.registroMedico ?? '', X(11), yMed + u(31), {
      width: u(400),
    });

    // ===== Encabezados y pie en todas las páginas =====
    const rango = doc.bufferedPageRange();
    for (let i = rango.start; i < rango.start + rango.count; i++) {
      doc.switchToPage(i);
      const mb = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      let y0 = M.top;
      if (i === rango.start) {
        const logo = LOGO_SEDE[orden.idSede] ?? LOGO_DEFECTO;
        try {
          doc.image(
            path.join(LOGOS_DIR, logo.archivo),
            X(0),
            y0 + u(100 - logo.h),
            { width: u(logo.w), height: u(logo.h) },
          );
        } catch {
          // sin logo
        }
        etiqueta(doc, 'Fecha Impresión', X(659.81), y0, u(93.08), {
          bold: true,
          size: 8,
          align: 'right',
        });
        etiqueta(doc, fechaLarga(), X(582.3), y0 + u(12.62), u(170.59), {
          size: 8,
          align: 'right',
        });
        etiqueta(
          doc,
          `LABORATORIO DE PATOLOGIA ${entidad}`.trim(),
          X(0),
          y0 + u(36.62),
          u(744.94),
          { bold: true, size: 13, align: 'center' },
        );
        y0 += u(102.92);
      }
      const Y = (cc: number) => y0 + u(cc);
      const rr = (x: number, y: number, w: number, h: number) =>
        doc
          .roundedRect(X(x) + 1, Y(y) + 1, u(w) - 2, u(h) - 2, 6)
          .lineWidth(1)
          .strokeColor(GRIS)
          .stroke();
      rr(0, 0, 578.3, 70.57);
      rr(582.68, 17.62, 162.26, 50.81);
      rr(2, 73.43, 741, 40);
      doc.strokeColor('black');
      etiqueta(doc, orden.consecutivo ?? '', X(644.94), Y(0), u(100), {
        bold: true,
        size: 13,
        align: 'right',
      });
      etiqueta(doc, 'Estudio No:', X(582.3), Y(5), u(62.64), { size: 8 });
      etiqueta(doc, 'Fecha Ingreso:', X(588.3), Y(23), u(80), { size: 8 });
      etiqueta(
        doc,
        fechaCorta(orden.fechaIngreso),
        X(657.55),
        Y(23),
        u(83.02),
        { size: 8, align: 'right' },
      );
      etiqueta(doc, 'Fecha Informe:', X(588.3), Y(36), u(80), { size: 8 });
      etiqueta(
        doc,
        fechaCorta(c.updatedAt ?? c.fecha),
        X(657.55),
        Y(36),
        u(83.02),
        { size: 8, align: 'right' },
      );
      etiqueta(doc, 'No. de Página:', X(588.3), Y(49), u(80), { size: 8 });
      etiqueta(
        doc,
        `${i - rango.start + 1} / ${rango.count}`,
        X(657.55),
        Y(49),
        u(83.02),
        { size: 8, align: 'right' },
      );

      etiqueta(doc, 'Nombre:', X(7), Y(6), u(92.83), { bold: true });
      etiqueta(doc, nombre, X(99.83), Y(6), u(363.21), { bold: true });
      etiqueta(doc, 'Identificacion:', X(7), Y(23), u(92.83), { bold: true });
      etiqueta(doc, identificacion, X(99.83), Y(23), u(100));
      etiqueta(doc, 'Edad:', X(199.83), Y(23), u(45.66), { bold: true });
      etiqueta(
        doc,
        edadAniosMeses(p?.fechaNacimiento),
        X(265.3),
        Y(23),
        u(118.87),
      );
      etiqueta(doc, 'Sexo:', X(422.64), Y(23), u(45.66), { bold: true });
      etiqueta(doc, p?.sexo ?? '', X(468.3), Y(23), u(100));
      etiqueta(doc, 'Telefono:', X(7), Y(41.62), u(92.83), { bold: true });
      etiqueta(doc, p?.telefono ?? '', X(99.83), Y(41.62), u(100));
      etiqueta(doc, 'Entidad:', X(199.83), Y(41.62), u(65.47), { bold: true });
      etiqueta(doc, orden.subentidad?.nombre ?? '', X(265.3), Y(41.62), u(303));

      etiqueta(doc, 'Atendido en:', X(9), Y(76), u(92.83), { bold: true });
      etiqueta(doc, entidad, X(101.83), Y(76), u(350));
      etiqueta(doc, 'Estudio:', X(451.83), Y(76), u(70), { bold: true });
      etiqueta(
        doc,
        orden.tipoEstudio?.nombreTipoEstudio ?? 'CITOLOGIA',
        X(520),
        Y(76),
        u(203),
      );
      etiqueta(doc, 'Muestra:', X(9), Y(93), u(92.83), { bold: true });
      etiqueta(doc, 'CITOLOGÍA CERVICOVAGINAL', X(102.83), Y(93), u(620.17));

      doc
        .moveTo(X(10), Y(120))
        .lineTo(X(723), Y(120))
        .lineWidth(u(4))
        .strokeColor('#800000')
        .stroke();
      doc.strokeColor('black').lineWidth(1);
      etiqueta(
        doc,
        `${firmado ? '' : 'INFORME PRELIMINAR - '}INFORME DE CITOLOGÍA CERVICOVAGINAL No. ${orden.consecutivo ?? ''}`,
        X(2),
        Y(127),
        u(738.94),
        { bold: true, size: 12, align: 'center' },
      );

      const yPie = doc.page.height - M.bottom - u(27.36);
      doc.moveTo(X(0), yPie).lineTo(X(743), yPie).lineWidth(0.75).stroke();
      doc
        .font(FUENTES.calibri)
        .fontSize(8)
        .text(orden.sede?.direccion ?? '', X(2), yPie + 1.5, {
          width: u(739),
          align: 'center',
          height: u(26),
          ellipsis: true,
        });
      doc.page.margins.bottom = mb;
    }

    const buffer = await pdfABuffer(doc);
    return {
      buffer,
      nombreArchivo:
        nombreArchivoSeguro(
          `${orden.consecutivo} - ${nombre} - ${identificacion}`,
        ) + '.pdf',
    };
  }
}
