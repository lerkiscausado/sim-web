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

@Injectable()
export class PatologiaPdfService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  /**
   * Genera el PDF del informe al vuelo (sin pasar por impresion_patologia,
   * según lo decidido) y devuelve el buffer listo para enviar como descarga.
   */
  async generar(idOrden: number): Promise<Buffer> {
    const patologia = await this.patologiaRepository.findOne({
      where: { idOrden },
      relations: [
        'orden',
        'orden.paciente',
        'orden.contrato',
        'diagnosticoCie10',
        'patologo',
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
      const doc = new PDFDocument({ size: 'letter', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const paciente = patologia.orden?.paciente;
      const nombrePaciente = paciente
        ? [paciente.primerNombre, paciente.segundoNombre, paciente.primerApellido, paciente.segundoApellido]
            .filter(Boolean)
            .join(' ')
        : '—';

      // --- Membrete ---
      if (empresa?.logo) {
        try {
          doc.image(empresa.logo, 50, 45, { width: 80 });
        } catch {
          // Si el blob no es una imagen válida, seguimos sin logo.
        }
      }
      doc
        .fontSize(14)
        .text(empresa?.nombre ?? 'Laboratorio de Patología', 150, 50, { align: 'right' })
        .fontSize(9)
        .text(empresa?.direccion ?? '', { align: 'right' })
        .text([empresa?.ciudad, empresa?.telefono].filter(Boolean).join(' · '), { align: 'right' });

      doc.moveDown(3);
      doc
        .fontSize(16)
        .text('INFORME DE PATOLOGÍA', { align: 'center', underline: true });
      doc.moveDown();

      // --- Datos del paciente / orden ---
      doc.fontSize(10);
      const orden = patologia.orden;
      const filas: [string, string][] = [
        ['Consecutivo orden', orden?.numeroOrden ?? String(idOrden)],
        ['Paciente', nombrePaciente],
        ['Identificación', paciente?.identificacion ?? '—'],
        ['Fecha ingreso', orden?.fechaIngreso ?? '—'],
        ['Fecha informe', patologia.fechaSalida],
      ];
      for (const [label, value] of filas) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
      }

      doc.moveDown();
      this.seccion(doc, 'TIPO DE MUESTRA', patologia.tipoMuestra);
      this.seccion(doc, 'SITIO DE LESIÓN', patologia.sitioLesion);
      this.seccion(doc, 'ESTUDIO SOLICITADO', patologia.solicitado);
      this.seccion(doc, 'DESCRIPCIÓN MACROSCÓPICA', htmlToPlainText(patologia.descripcionMacroscopica));
      this.seccion(doc, 'DESCRIPCIÓN MICROSCÓPICA', htmlToPlainText(patologia.descripcionMicroscopica));
      this.seccion(
        doc,
        'DIAGNÓSTICO',
        `${htmlToPlainText(patologia.diagnostico)}${
          patologia.diagnosticoCie10?.nombreDiagnostico
            ? ` (CIE10 ${patologia.codigoDiagnostico} — ${patologia.diagnosticoCie10.nombreDiagnostico})`
            : ''
        }`,
      );
      if (patologia.observaciones) {
        this.seccion(doc, 'OBSERVACIONES', patologia.observaciones);
      }

      // --- Firma del patólogo ---
      doc.moveDown(2);
      const firmaY = doc.y;
      if (patologia.patologo?.firma) {
        try {
          doc.image(patologia.patologo.firma, 50, firmaY, { width: 150 });
        } catch {
          // sin firma válida, se deja el espacio en blanco para firma manual
        }
      }
      doc.moveDown(4);
      doc
        .font('Helvetica-Bold')
        .text(patologia.patologo?.nombreEmpleado ?? '—')
        .font('Helvetica')
        .fontSize(9)
        .text(patologia.patologo?.registroMedico ? `Registro médico: ${patologia.patologo.registroMedico}` : '');

      doc.end();
    });
  }

  private seccion(doc: PDFKit.PDFDocument, titulo: string, contenido: string) {
    doc.font('Helvetica-Bold').fontSize(10).text(titulo);
    doc.font('Helvetica').fontSize(10).text(contenido || '—');
    doc.moveDown(0.75);
  }
}
