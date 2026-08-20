import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFKit from 'pdfkit';
const PDFDocument = PDFKit as unknown as new (options?: PDFKit.PDFDocumentOptions) => PDFKit.PDFDocument;
import { Patologia } from './entities/patologia.entity';
import { Empresa } from '../documentos-soporte/entities/empresa.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

/**
 * Los campos macro/micro/diagnóstico pueden venir en HTML (texto enriquecido
 * capturado desde el editor o copiado de una plantilla de patología). pdfkit
 * no renderiza HTML, así que lo convertimos a texto plano legible antes de
 * imprimirlo: <br>/</p>/</li> se convierten en saltos de línea, las listas
 * numeradas/con viñeta se preservan como "- " y se quita cualquier otra
 * etiqueta.
 */
function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/(li|p|div)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function calcularEdad(fechaNacimientoISO: string | undefined): string {
  if (!fechaNacimientoISO) return '—';
  const nacimiento = new Date(fechaNacimientoISO);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} años`;
}

@Injectable()
export class PatologiaPdfService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  /**
   * Genera el PDF del informe replicando la estructura EXACTA del reporte
   * VB.NET original (Reportes/xrPatologiaCD.Designer.vb, alimentado por la
   * vista `ReportePatologiaCD`). Se generó comparando campo por campo con
   * ese archivo, en vez de diseñar un formato nuevo.
   *
   * NOTA sobre una particularidad del reporte original que se replicó tal
   * cual: el campo etiquetado "Entidad:" en el bloque de datos del paciente
   * en realidad está enlazado a `DIRECCION` (la dirección del paciente), no
   * al nombre de la entidad — así está en el .Designer.vb original
   * (XrLabel13 "Entidad:" seguido de XrLabel17 enlazado a [DIRECCION]).
   * Se mantiene igual por pedido explícito de réplica exacta; si prefieres
   * corregirlo dime y lo ajusto.
   */
  async generar(idOrden: number): Promise<Buffer> {
    const patologia = await this.patologiaRepository.findOne({
      where: { idOrden },
      relations: [
        'orden',
        'orden.paciente',
        'orden.contrato',
        'orden.contrato.entidad',
        'orden.sede',
        'diagnosticoCie10',
        'patologo',
        'patologo.especialidad',
      ],
    });
    if (!patologia) {
      throw new NotFoundException(`No hay informe de patología para la orden ${idOrden}`);
    }

    // Único registro de empresa activo (despliegue de una sola sede/licencia).
    const empresa = await this.empresaRepository.findOne({
      where: { estado: EstadoActivoInactivo.ACTIVO },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'letter', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const orden = patologia.orden;
      const paciente = orden?.paciente;
      const nombreEntidadContrato = orden?.contrato?.entidad?.nombreEntidad ?? empresa?.nombre ?? '';
      const nombrePaciente = paciente
        ? [paciente.primerNombre, paciente.segundoNombre, paciente.primerApellido, paciente.segundoApellido]
            .filter(Boolean)
            .join(' ')
        : '—';

      // ===== ENCABEZADO (ReportHeader): LABORATORIO DE PATOLOGIA [empresa] =====
      if (empresa?.logo) {
        try {
          doc.image(empresa.logo, 40, 35, { width: 60 });
        } catch {
          // blob no es imagen válida, se omite el logo
        }
      }
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`LABORATORIO DE PATOLOGIA ${nombreEntidadContrato}`.trim(), 110, 38, { width: 460 });
      doc.font('Helvetica').fontSize(8).text(empresa?.direccion ?? '', 110, 55, { width: 460 });

      doc.moveDown(2);
      doc.moveTo(40, 90).lineTo(772, 90).lineWidth(0).stroke();
      doc.y = 95;

      // ===== TÍTULO + Sede =====
      doc.fontSize(11).font('Helvetica-Bold').text(`INFORME ANATOMOPATOLOGICO No. ${orden?.consecutivo ?? ''}`, 40, doc.y);
      if (orden?.sede?.nombre) {
        doc.fontSize(8).font('Helvetica').text(orden.sede.nombre, { align: 'right' });
      }
      doc.moveDown(0.5);

      // ===== Línea gruesa color vino (XrLine1) =====
      doc.moveTo(40, doc.y).lineTo(560, doc.y).lineWidth(2.5).strokeColor('#800000').stroke();
      doc.strokeColor('black');
      doc.moveDown(0.75);

      // ===== BLOQUE DATOS DEL PACIENTE (XrPanel1) =====
      const yPanel1 = doc.y;
      doc.rect(40, yPanel1, 520, 55).stroke();
      const filaPaciente = (
        label: string,
        value: string,
        x: number,
        y: number,
        labelWidth = 55,
      ) => {
        doc.font('Helvetica-Bold').fontSize(8).text(label, x, y, { continued: false });
        doc.font('Helvetica').fontSize(8).text(value || '—', x + labelWidth, y);
      };
      filaPaciente('Nombre:', nombrePaciente, 45, yPanel1 + 4, 60);
      filaPaciente('Identificacion:', paciente?.identificacion ?? '—', 45, yPanel1 + 21, 75);
      filaPaciente('Edad:', calcularEdad(paciente?.fechaNacimiento), 200, yPanel1 + 21, 35);
      filaPaciente('Sexo:', paciente?.sexo === 'M' ? 'Masculino' : 'Femenino', 350, yPanel1 + 21, 35);
      filaPaciente('Telefono:', paciente?.telefono ?? '—', 45, yPanel1 + 38, 55);
      // Réplica exacta del original: la etiqueta "Entidad:" está enlazada a
      // la DIRECCIÓN del paciente en el .Designer.vb fuente (ver nota arriba).
      filaPaciente('Entidad:', paciente?.direccion ?? '—', 200, yPanel1 + 38, 50);

      doc.y = yPanel1 + 60;

      // ===== BLOQUE DATOS DEL ESTUDIO (XrPanel2 + segundo bloque) =====
      const yPanel2 = doc.y;
      doc.rect(40, yPanel2, 520, 72).stroke();
      filaPaciente('Estudio No:', orden?.consecutivo ?? '—', 380, yPanel2 + 2, 65);
      filaPaciente('Fecha Ingreso:', orden?.fechaIngreso ?? '—', 380, yPanel2 + 14, 70);
      filaPaciente('Fecha Salida:', patologia.fechaSalida ?? '—', 380, yPanel2 + 27, 70);
      filaPaciente('Atendido en:', nombreEntidadContrato || '—', 45, yPanel2 + 4, 70);
      filaPaciente('Espécimen:', patologia.tipoMuestra ?? '—', 45, yPanel2 + 21, 65);
      filaPaciente('Remitente Dr(a):', patologia.solicitado ?? '—', 300, yPanel2 + 4, 90);

      doc.y = yPanel2 + 76;

      // ===== Descripción Macroscópica =====
      doc.font('Helvetica-Bold').fontSize(9).text('Descripción Macroscópica:', 40, doc.y);
      doc.font('Helvetica').fontSize(9).text(htmlToPlainText(patologia.descripcionMacroscopica) || '—', { width: 520 });
      doc.moveDown(0.5);

      // ===== Línea divisoria gruesa (XrLine1 equivalente en el detalle) =====
      doc.moveTo(40, doc.y).lineTo(560, doc.y).lineWidth(2.5).strokeColor('#800000').stroke();
      doc.strokeColor('black');
      doc.moveDown(0.5);

      // ===== Impresión Diagnóstica (xrDiagnostico, HTML -> [DIAGNOSTICO]) =====
      doc.font('Helvetica-Bold').fontSize(9).text('Impresión Diagnóstica:', 40, doc.y);
      const diagnosticoTexto = `${htmlToPlainText(patologia.diagnostico)}${
        patologia.diagnosticoCie10?.nombreDiagnostico
          ? ` (CIE10 ${patologia.codigoDiagnostico} — ${patologia.diagnosticoCie10.nombreDiagnostico})`
          : ''
      }`;
      doc.font('Helvetica').fontSize(9).text(diagnosticoTexto || '—', { width: 520 });
      doc.moveDown(1);

      // ===== Nota legal fija (XrLabel33) — con el nombre de la empresa real =====
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(
          'Nota: el presente informe debe ser correlacionado con la clínica, imágenes y demás paraclínicos, ' +
            'para una mejor interpretación del diagnóstico por parte del médico tratante. Si hay discrepancia, ' +
            'favor solicitar revisión o aclaración al servicio de patología.',
          40,
          doc.y,
          { width: 520 },
        );
      if (empresa?.nombre) {
        doc.text(`ESTUDIO REALIZADO POR ${empresa.nombre.toUpperCase()}`, { width: 520 });
      }

      // ===== Firma del patólogo (ReportFooter) =====
      doc.moveDown(2);
      const firmaY = doc.y;
      if (patologia.patologo?.firma) {
        try {
          doc.image(patologia.patologo.firma, 40, firmaY, { width: 130 });
        } catch {
          // sin firma válida, se deja el espacio en blanco para firma manual
        }
      }
      doc.y = firmaY + 45;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(patologia.patologo?.nombreEmpleado ?? '—', 40, doc.y);
      doc
        .font('Helvetica')
        .fontSize(8)
        .text(patologia.patologo?.especialidad?.nombreEspecialidad ?? '');
      if (patologia.patologo?.registroMedico) {
        doc.text(`Registro médico: ${patologia.patologo.registroMedico}`);
      }
      doc.fontSize(7).fillColor('#666666').text(`Fecha Impresión: ${new Date().toLocaleString('es-CO')}`, { align: 'right' });
      doc.fillColor('black');

      doc.end();
    });
  }
}
