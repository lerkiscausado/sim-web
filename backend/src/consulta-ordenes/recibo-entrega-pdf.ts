import * as path from 'path';
import { Ordenes } from '../admisiones/entities/ordenes.entity';
import { EntregaResultados } from '../atenciones/entities/entrega-resultados.entity';
import {
  PDFDocument,
  FUENTES,
  LOGOS_DIR,
  registrarFuentes,
  pdfABuffer,
  fechaCorta,
  fechaLarga,
  edadAniosMeses,
} from '../reportes/pdf-utils';

/**
 * Recibo de entrega de resultados (rptEntregaResultados, licencias 11 y 16):
 * comprobante media carta que se entrega al paciente con la fecha en que
 * puede reclamar su resultado.
 */
export async function reciboEntregaPdf(
  orden: Ordenes,
  entrega: EntregaResultados,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [612, 396],
    margins: { top: 24, bottom: 20, left: 36, right: 36 },
  });
  registrarFuentes(doc);
  const x0 = 36;
  const ancho = 540;
  const p = orden.paciente;
  const nombre = p
    ? [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
        .filter(Boolean)
        .join(' ')
    : '';

  try {
    doc.image(path.join(LOGOS_DIR, 'dra-sandra.png'), x0, 22, { height: 62 });
  } catch {
    // sin logo
  }
  doc
    .font(FUENTES.calibriBold)
    .fontSize(13)
    .text(
      'CLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGIA ONCOLOGICA',
      x0 + 60,
      30,
      { width: ancho - 120, align: 'center' },
    );
  doc
    .font(FUENTES.calibriBold)
    .fontSize(11)
    .text('RECIBO DE ENTREGA DE RESULTADOS', x0 + 60, doc.y + 4, {
      width: ancho - 120,
      align: 'center',
    });
  doc
    .font(FUENTES.calibri)
    .fontSize(8)
    .text(fechaLarga(), x0, 24, { width: ancho, align: 'right' });
  doc
    .font(FUENTES.calibriBold)
    .fontSize(14)
    .text(orden.consecutivo ?? '', x0, 36, { width: ancho, align: 'right' });

  let y = 100;
  doc
    .roundedRect(x0, y, ancho, 150, 6)
    .lineWidth(1)
    .strokeColor('#DCDCDC')
    .stroke()
    .strokeColor('black');
  const fila = (
    label: string,
    valor: string,
    x: number,
    yy: number,
    w: number,
  ) => {
    doc
      .font(FUENTES.calibriBold)
      .fontSize(10)
      .text(label, x, yy, { width: 105, lineBreak: false });
    doc
      .font(FUENTES.calibri)
      .fontSize(10)
      .text(valor || '', x + 105, yy, {
        width: w - 105,
        lineBreak: false,
        ellipsis: true,
        height: 14,
      });
  };
  y += 10;
  fila('Paciente:', nombre, x0 + 10, y, 520);
  y += 20;
  fila(
    'Identificación:',
    `${p?.idTipoIdentificacion ?? ''}${p?.identificacion ?? ''}`,
    x0 + 10,
    y,
    260,
  );
  fila('Edad:', edadAniosMeses(p?.fechaNacimiento), x0 + 280, y, 250);
  y += 20;
  fila('Teléfono:', p?.telefono ?? '', x0 + 10, y, 260);
  fila(
    'Entidad:',
    orden.contrato?.entidad?.nombreEntidad ?? '',
    x0 + 280,
    y,
    250,
  );
  y += 20;
  fila('Estudio:', orden.tipoEstudio?.nombreTipoEstudio ?? '', x0 + 10, y, 260);
  fila('Sede:', orden.sede?.nombre ?? '', x0 + 280, y, 250);
  y += 20;
  fila('Espécimen:', orden.especimen?.nombre ?? '', x0 + 10, y, 520);
  y += 20;
  fila('Fecha ingreso:', fechaCorta(orden.fechaIngreso), x0 + 10, y, 260);
  doc
    .font(FUENTES.calibriBold)
    .fontSize(12)
    .text(
      `FECHA DE ENTREGA: ${fechaCorta(entrega.fechaEntrega)}`,
      x0 + 280,
      y - 2,
      { width: 250 },
    );

  y = 266;
  doc
    .font(FUENTES.calibriItalic)
    .fontSize(8.5)
    .text(
      'Presente este recibo para reclamar su resultado. Los resultados se entregan al paciente o a quien presente ' +
        'este recibo junto con la copia del documento de identidad del paciente.',
      x0,
      y,
      { width: ancho, align: 'justify' },
    );
  y = 318;
  doc
    .moveTo(x0 + 10, y)
    .lineTo(x0 + 220, y)
    .lineWidth(0.75)
    .stroke();
  doc
    .moveTo(x0 + 320, y)
    .lineTo(x0 + 530, y)
    .stroke();
  doc
    .font(FUENTES.calibri)
    .fontSize(8.5)
    .text('Recibido por (paciente)', x0 + 10, y + 3, {
      width: 210,
      align: 'center',
    });
  doc.text('Entregado por', x0 + 320, y + 3, { width: 210, align: 'center' });
  doc
    .font(FUENTES.calibri)
    .fontSize(7.5)
    .fillColor('#555555')
    .text(orden.sede?.direccion ?? '', x0, 360, {
      width: ancho,
      align: 'center',
      height: 20,
      ellipsis: true,
    });
  return pdfABuffer(doc);
}
