import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// pdfkit se distribuye como CommonJS (export = PDFDocument). require() es la
// forma segura de importarlo sin depender de la interop ESM del compilador
// (con "import * as X" compilaba bien pero fallaba en runtime con
// "X is not a constructor").
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit') as new (options?: PDFKit.PDFDocumentOptions) => PDFKit.PDFDocument;
import { Patologia } from './entities/patologia.entity';
import { Empresa } from '../documentos-soporte/entities/empresa.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

/**
 * Convierte el HTML del editor de texto enriquecido a texto plano legible
 * para pdfkit, preservando viñetas (·) para listas sin numerar y números
 * reales (1., 2., 3.) para listas numeradas, ya que el "DIAGNÓSTICO
 * ANATOMOPATOLÓGICO" del reporte real usa exactamente ese patrón (items
 * numerados con sub-viñetas).
 */
function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return '';
  let contador = 0;
  let out = html
    .replace(/<ol[^>]*>/gi, () => {
      contador = 0;
      return '\u0000OL\u0000';
    })
    .replace(/<\/ol>/gi, '')
    .replace(/<ul[^>]*>/gi, '\u0000UL\u0000')
    .replace(/<\/ul>/gi, '');

  // Procesa <li> respetando si está dentro de la última lista abierta (OL/UL)
  const partes = out.split(/(\u0000OL\u0000|\u0000UL\u0000)/);
  let modoActual: 'OL' | 'UL' | null = null;
  out = partes
    .map((parte) => {
      if (parte === '\u0000OL\u0000') {
        modoActual = 'OL';
        return '';
      }
      if (parte === '\u0000UL\u0000') {
        modoActual = 'UL';
        return '';
      }
      return parte.replace(/<li[^>]*>/gi, () => {
        if (modoActual === 'OL') {
          contador++;
          return `${contador}. `;
        }
        return '· ';
      });
    })
    .join('');

  return out
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

function calcularEdadTexto(fechaNacimientoISO: string | undefined): string {
  if (!fechaNacimientoISO) return '—';
  const nacimiento = new Date(fechaNacimientoISO);
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (hoy.getDate() < nacimiento.getDate()) meses--;
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  return meses > 0 ? `${anios} AÑOS ${meses} MESES` : `${anios} AÑOS`;
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
   * Genera el PDF replicando el reporte real (Reportes/xrPatologiaNuestra.vb
   * + .resx), verificado contra un PDF de salida real compartido por el
   * usuario, campo por campo:
   *
   * - "Entidad:" en el bloque de paciente = entidad del contrato (aseguradora
   *   del paciente), no la dirección — confirmado con el PDF real (mostraba
   *   "SALUD TOTAL", no una dirección), aunque el .Designer.vb original la
   *   enlaza a un campo de la vista llamado DIRECCION (la vista real le da
   *   ese alias al nombre de la entidad, no a la dirección del paciente).
   * - "Impresión Diagnostica:" en el bloque de estudio: el .Designer.vb no
   *   tiene un binding explícito visible para este campo — se usa
   *   patologia.sitioLesion como mejor aproximación (único campo de
   *   Patologia sin ubicación aún en el layout). Si no es el correcto,
   *   dímelo y lo ajusto.
   * - Nota legal y "ESTUDIO REALIZADO POR..." son texto fijo del reporte
   *   original (confirmado igual en el PDF real de otro cliente), se
   *   replican literalmente, sin sustituir por datos de la empresa.
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
      const nombrePaciente = paciente
        ? [paciente.primerNombre, paciente.segundoNombre, paciente.primerApellido, paciente.segundoApellido]
            .filter(Boolean)
            .join(' ')
        : '—';
      const nombreEntidadContrato = orden?.contrato?.entidad?.nombreEntidad ?? '—';

      const filaCampo = (label: string, value: string, x: number, y: number, labelWidth: number) => {
        doc.font('Helvetica-Bold').fontSize(8).text(label, x, y);
        doc.font('Helvetica').fontSize(8).text(value || '—', x + labelWidth, y);
      };

      // ===== ENCABEZADO: logo + LABORATORIO DE PATOLOGIA [empresa] + fecha impresión =====
      if (empresa?.logo) {
        try {
          doc.image(empresa.logo, 40, 32, { width: 55 });
        } catch {
          // blob no es imagen válida, se omite el logo
        }
      }
      doc.fontSize(13).font('Helvetica-Bold').text(`LABORATORIO DE PATOLOGIA ${empresa?.nombre ?? ''}`.trim(), 105, 38, {
        width: 350,
      });
      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .text('Fecha Impresión', 460, 32, { width: 130, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(7)
        .text(
          new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          460,
          42,
          { width: 130, align: 'right' },
        );

      doc.y = 78;

      // ===== TÍTULO: INFORME ANATOMOPATOLOGICO No. [consecutivo] =====
      doc.fontSize(11).font('Helvetica-Bold').text(`INFORME ANATOMOPATOLOGICO No. ${orden?.consecutivo ?? ''}`, 40, doc.y);
      doc.moveDown(0.4);

      // ===== Línea gruesa color vino =====
      doc.moveTo(40, doc.y).lineTo(560, doc.y).lineWidth(2.5).strokeColor('#800000').stroke();
      doc.strokeColor('black');
      doc.moveDown(0.5);

      // ===== BLOQUE DATOS DEL PACIENTE (izquierda) + ESTUDIO No / fechas (derecha) =====
      const yBloque1 = doc.y;
      doc.rect(40, yBloque1, 340, 55).stroke();
      filaCampo('Nombre:', nombrePaciente, 45, yBloque1 + 4, 60);
      filaCampo('Identificacion:', paciente?.identificacion ?? '—', 45, yBloque1 + 21, 75);
      filaCampo('Edad:', calcularEdadTexto(paciente?.fechaNacimiento), 190, yBloque1 + 21, 35);
      filaCampo('Sexo:', paciente?.sexo === 'M' ? 'M' : 'F', 300, yBloque1 + 21, 35);
      filaCampo('Telefono:', paciente?.telefono ?? '—', 45, yBloque1 + 38, 55);
      filaCampo('Entidad:', nombreEntidadContrato, 190, yBloque1 + 38, 50);

      doc.rect(390, yBloque1, 170, 55).stroke();
      doc.font('Helvetica-Bold').fontSize(9).text('Estudio No:', 395, yBloque1 + 4, { continued: true }).text(
        ` ${orden?.consecutivo ?? ''}`,
      );
      filaCampo('Fecha Ingreso:', orden?.fechaIngreso ?? '—', 395, yBloque1 + 20, 70);
      filaCampo('Fecha Salida:', patologia.fechaSalida ?? '—', 395, yBloque1 + 33, 70);
      doc.font('Helvetica').fontSize(7).text('No. de Página: 1/1', 395, yBloque1 + 46);

      doc.y = yBloque1 + 60;

      // ===== BLOQUE DATOS DEL ESTUDIO (Atendido en / Espécimen / Impresión Diagnóstica / Remitente) =====
      const yBloque2 = doc.y;
      doc.rect(40, yBloque2, 520, 55).stroke();
      filaCampo('Atendido en:', empresa?.nombre ?? '—', 45, yBloque2 + 4, 70);
      filaCampo('Remitente Dr(a):', patologia.solicitado ?? '—', 300, yBloque2 + 4, 90);
      filaCampo('Espécimen:', patologia.tipoMuestra ?? '—', 45, yBloque2 + 20, 65);
      filaCampo('Impresión Diagnostica:', patologia.sitioLesion ?? '—', 45, yBloque2 + 36, 115);

      doc.y = yBloque2 + 60;

      // ===== Título del informe =====
      doc.font('Helvetica-Bold').fontSize(10).text(`INFORME ANATOMOPATOLOGICO No.${orden?.consecutivo ?? ''}`, 40, doc.y, {
        width: 520,
        align: 'center',
      });
      doc.moveDown(0.75);

      // ===== Descripción Macroscópica =====
      doc.font('Helvetica-Bold').fontSize(9).text('DESCRIPCIÓN MACROSCÓPICA:', 40, doc.y);
      doc.font('Helvetica').fontSize(9).text(htmlToPlainText(patologia.descripcionMacroscopica) || '—', { width: 520 });
      doc.moveDown(0.75);

      // ===== Descripción Microscópica =====
      doc.font('Helvetica-Bold').fontSize(9).text('DESCRIPCIÓN MICROSCÓPICA:', 40, doc.y);
      doc.font('Helvetica').fontSize(9).text(htmlToPlainText(patologia.descripcionMicroscopica) || '—', { width: 520 });
      doc.moveDown(0.75);

      // ===== Diagnóstico Anatomopatológico =====
      doc.font('Helvetica-Bold').fontSize(9).text('DIAGNÓSTICO ANATOMOPATOLÓGICO:', 40, doc.y);
      const diagnosticoTexto = `${htmlToPlainText(patologia.diagnostico)}${
        patologia.diagnosticoCie10?.nombreDiagnostico
          ? ` (CIE10 ${patologia.codigoDiagnostico} — ${patologia.diagnosticoCie10.nombreDiagnostico})`
          : ''
      }`;
      doc.font('Helvetica').fontSize(9).text(diagnosticoTexto || '—', { width: 520 });
      doc.moveDown(1);

      // ===== Texto legal fijo del reporte original (idéntico, no se sustituye) =====
      doc
        .font('Helvetica-Oblique')
        .fontSize(7.5)
        .text(
          'El material correspondeinte a laminas y bloques de parafina del presente estudio histopatopatológico será ' +
            'archivado en nuestro laboratorio por un periodo de 5 años. El usuario que lo desee podrá reclamarlos ' +
            'durante ese periodo.',
          40,
          doc.y,
          { width: 520 },
        );
      doc.text(
        'Nota: el presente informe debe ser correlacionado con la clínica, imágenes y demás paraclínicos, para una ' +
          'mejor interpretación del diagnóstico por parte del médico tratante. Si hay discrepancia, favor solicitar ' +
          'revisión o aclaración al servicio de patología.',
        { width: 520 },
      );
      doc.text('ESTUDIO REALIZADO POR CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA', { width: 520 });

      // ===== Firma del patólogo =====
      doc.moveDown(2);
      const firmaY = doc.y;
      if (patologia.patologo?.firma) {
        try {
          doc.image(patologia.patologo.firma, 40, firmaY, { width: 120 });
        } catch {
          // sin firma válida, se deja el espacio en blanco para firma manual
        }
      }
      doc.y = firmaY + 40;
      doc.font('Helvetica-Bold').fontSize(9).text(patologia.patologo?.nombreEmpleado ?? '—', 40, doc.y);
      const especialidadRegistro = [
        patologia.patologo?.especialidad?.nombreEspecialidad,
        patologia.patologo?.registroMedico ? `RM ${patologia.patologo.registroMedico}` : null,
      ]
        .filter(Boolean)
        .join(' ');
      doc.font('Helvetica').fontSize(8).text(especialidadRegistro);

      // ===== Pie de página: datos de contacto de la empresa =====
      doc.moveDown(1.5);
      doc.moveTo(40, doc.y).lineTo(560, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke();
      doc.strokeColor('black');
      const piePagina = [empresa?.nombre, empresa?.direccion, empresa?.telefono, empresa?.email]
        .filter(Boolean)
        .join(' - ');
      doc.font('Helvetica').fontSize(7).fillColor('#666666').text(piePagina, 40, doc.y + 4, { width: 520, align: 'center' });
      doc.fillColor('black');

      doc.end();
    });
  }
}
