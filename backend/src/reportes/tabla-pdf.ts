import * as path from 'path';
import {
  PDFDocument,
  FUENTES,
  LOGOS_DIR,
  registrarFuentes,
  pdfABuffer,
  fechaLarga,
} from './pdf-utils';

export interface ColumnaTabla {
  titulo: string;
  campo: string;
  /** Peso relativo del ancho de la columna. */
  ancho?: number;
  align?: 'left' | 'right' | 'center';
}

/**
 * Listado tabular en PDF (equivalente a GridControl.ExportToPdf / reportes de
 * relación del VB.NET): encabezado con logo y título, tabla con cabecera
 * repetida en cada página y numeración "Página x de y".
 */
export async function tablaPdf(opciones: {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaTabla[];
  filas: Record<string, unknown>[];
  horizontal?: boolean;
  logo?: string;
  pie?: string;
}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: opciones.horizontal === false ? 'portrait' : 'landscape',
    margins: { top: 30, bottom: 36, left: 28, right: 28 },
    bufferPages: true,
  });
  registrarFuentes(doc);
  const x0 = doc.page.margins.left;
  const anchoTotal =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pesos = opciones.columnas.map((c) => c.ancho ?? 1);
  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const anchos = pesos.map((p) => (p / sumaPesos) * anchoTotal);
  const tam = 7.5;
  const pad = 2.5;

  let y = doc.page.margins.top;
  try {
    doc.image(path.join(LOGOS_DIR, opciones.logo ?? 'dra-sandra.png'), x0, y, {
      height: 46,
    });
  } catch {
    // sin logo
  }
  doc
    .font(FUENTES.calibriBold)
    .fontSize(13)
    .text(opciones.titulo, x0, y + 6, { width: anchoTotal, align: 'center' });
  if (opciones.subtitulo)
    doc
      .font(FUENTES.calibri)
      .fontSize(9.5)
      .text(opciones.subtitulo, x0, doc.y + 1, {
        width: anchoTotal,
        align: 'center',
      });
  doc
    .font(FUENTES.calibri)
    .fontSize(7.5)
    .text(`Fecha impresión: ${fechaLarga()}`, x0, y, {
      width: anchoTotal,
      align: 'right',
    });
  y = Math.max(doc.y, y + 50) + 6;

  const cabecera = () => {
    doc.font(FUENTES.calibriBold).fontSize(tam);
    const alto =
      Math.max(
        ...opciones.columnas.map((c, i) =>
          doc.heightOfString(c.titulo, { width: anchos[i] - pad * 2 }),
        ),
      ) +
      pad * 2;
    doc.rect(x0, y, anchoTotal, alto).fill('#7A1F1F');
    let x = x0;
    opciones.columnas.forEach((c, i) => {
      doc
        .fillColor('white')
        .text(c.titulo, x + pad, y + pad, {
          width: anchos[i] - pad * 2,
          align: c.align ?? 'left',
        });
      x += anchos[i];
    });
    doc.fillColor('black');
    y += alto;
  };
  cabecera();

  const limite = () => doc.page.height - doc.page.margins.bottom - 6;
  opciones.filas.forEach((fila, idx) => {
    doc.font(FUENTES.calibri).fontSize(tam);
    const textos = opciones.columnas.map((c) => {
      const v = fila[c.campo];
      return v === null || v === undefined ? '' : String(v);
    });
    const alto =
      Math.max(
        ...textos.map((t, i) =>
          doc.heightOfString(t || ' ', { width: anchos[i] - pad * 2 }),
        ),
      ) +
      pad * 2;
    if (y + alto > limite()) {
      doc.addPage();
      y = doc.page.margins.top;
      cabecera();
      doc.font(FUENTES.calibri).fontSize(tam);
    }
    if (idx % 2 === 1)
      doc.rect(x0, y, anchoTotal, alto).fill('#F5F5F5').fillColor('black');
    let x = x0;
    textos.forEach((t, i) => {
      doc.text(t, x + pad, y + pad, {
        width: anchos[i] - pad * 2,
        align: opciones.columnas[i].align ?? 'left',
      });
      x += anchos[i];
    });
    doc
      .moveTo(x0, y + alto)
      .lineTo(x0 + anchoTotal, y + alto)
      .lineWidth(0.3)
      .strokeColor('#CCCCCC')
      .stroke()
      .strokeColor('black');
    y += alto;
  });

  doc.font(FUENTES.calibriBold).fontSize(8);
  if (y + 14 > limite()) {
    doc.addPage();
    y = doc.page.margins.top;
  }
  doc.text(`Total registros: ${opciones.filas.length}`, x0, y + 4, {
    width: anchoTotal,
  });

  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    const mb = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const yp = doc.page.height - 24;
    doc.font(FUENTES.calibri).fontSize(7.5).fillColor('#555555');
    if (opciones.pie)
      doc.text(opciones.pie, x0, yp, {
        width: anchoTotal * 0.8,
        lineBreak: false,
        ellipsis: true,
      });
    doc.text(`Página ${i - rango.start + 1} de ${rango.count}`, x0, yp, {
      width: anchoTotal,
      align: 'right',
      lineBreak: false,
    });
    doc.fillColor('black');
    doc.page.margins.bottom = mb;
  }
  return pdfABuffer(doc);
}
