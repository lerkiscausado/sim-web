import * as path from 'path';

// pdfkit se distribuye como CommonJS (export = PDFDocument). require() es la
// forma segura de importarlo sin depender de la interop ESM del compilador.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const PDFDocument = require('pdfkit') as new (
  options?: PDFKit.PDFDocumentOptions,
) => PDFKit.PDFDocument;

export const ASSETS_DIR = path.join(__dirname, 'assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');
export const LOGOS_DIR = path.join(ASSETS_DIR, 'logos');

/**
 * Los reportes DevExpress del VB.NET usan Calibri (etiquetas) y Arial (texto
 * del diagnóstico). Se registran Carlito y Liberation Sans, sus equivalentes
 * métricos libres (OFL), para que el texto ocupe el mismo espacio.
 */
export const FUENTES = {
  calibri: 'Calibri',
  calibriBold: 'Calibri-Bold',
  calibriItalic: 'Calibri-Italic',
  calibriBoldItalic: 'Calibri-BoldItalic',
  arial: 'Arial',
  arialBold: 'Arial-Bold',
  arialItalic: 'Arial-Italic',
  arialBoldItalic: 'Arial-BoldItalic',
} as const;

export function registrarFuentes(doc: PDFKit.PDFDocument) {
  doc.registerFont(
    FUENTES.calibri,
    path.join(FONTS_DIR, 'Carlito-Regular.ttf'),
  );
  doc.registerFont(
    FUENTES.calibriBold,
    path.join(FONTS_DIR, 'Carlito-Bold.ttf'),
  );
  doc.registerFont(
    FUENTES.calibriItalic,
    path.join(FONTS_DIR, 'Carlito-Italic.ttf'),
  );
  doc.registerFont(
    FUENTES.calibriBoldItalic,
    path.join(FONTS_DIR, 'Carlito-BoldItalic.ttf'),
  );
  doc.registerFont(
    FUENTES.arial,
    path.join(FONTS_DIR, 'LiberationSans-Regular.ttf'),
  );
  doc.registerFont(
    FUENTES.arialBold,
    path.join(FONTS_DIR, 'LiberationSans-Bold.ttf'),
  );
  doc.registerFont(
    FUENTES.arialItalic,
    path.join(FONTS_DIR, 'LiberationSans-Italic.ttf'),
  );
  doc.registerFont(
    FUENTES.arialBoldItalic,
    path.join(FONTS_DIR, 'LiberationSans-BoldItalic.ttf'),
  );
}

export function fuente(
  familia: 'calibri' | 'arial',
  bold: boolean,
  italic: boolean,
): string {
  const base = familia === 'arial' ? 'arial' : 'calibri';
  if (bold && italic) return FUENTES[`${base}BoldItalic`];
  if (bold) return FUENTES[`${base}Bold`];
  if (italic) return FUENTES[`${base}Italic`];
  return FUENTES[base];
}

/** Las medidas de los .Designer.vb están en centésimas de pulgada; pdfkit usa puntos (1/72"). */
export const u = (centesimas: number) => centesimas * 0.72;

/** Termina el documento y devuelve el PDF completo como Buffer. */
export function pdfABuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/** Igual al formato del XrPageInfo de los reportes: "{0:dddd, d 'de' MMMM 'de' yyyy}". */
export function fechaLarga(fecha = new Date()): string {
  return `${DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** dd/MM/yyyy a partir de 'yyyy-MM-dd' o Date (como muestran los reportes del VB.NET). */
export function fechaCorta(valor: string | Date | null | undefined): string {
  if (!valor) return '';
  if (valor instanceof Date) {
    return `${String(valor.getDate()).padStart(2, '0')}/${String(valor.getMonth() + 1).padStart(2, '0')}/${valor.getFullYear()}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
}

/** Edad "X AÑOS Y MESES", misma fórmula que la vista impresion_patologia del VB.NET. */
export function edadAniosMeses(
  fechaNacimiento: string | null | undefined,
  hoy = new Date(),
): string {
  if (!fechaNacimiento) return '';
  const n = new Date(`${String(fechaNacimiento).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(n.getTime())) return '';
  let anios = hoy.getFullYear() - n.getFullYear();
  let meses = hoy.getMonth() - n.getMonth();
  if (hoy.getDate() < n.getDate()) meses--;
  if (meses < 0) {
    anios--;
    meses += 12;
  }
  return `${anios} AÑOS ${meses} MESES`;
}

/** Texto seguro para nombres de archivo (Windows incluido). */
export function nombreArchivoSeguro(texto: string): string {
  return texto
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

/**
 * Equivalente a un XRLabel de una sola línea: padding de 2 centésimas,
 * sin salto de línea y con elipsis si el texto no cabe.
 */
export function etiqueta(
  doc: PDFKit.PDFDocument,
  texto: string,
  x: number,
  y: number,
  w: number,
  opts: {
    bold?: boolean;
    size?: number;
    align?: 'left' | 'right' | 'center';
    italic?: boolean;
  } = {},
) {
  const f = opts.bold
    ? opts.italic
      ? FUENTES.calibriBoldItalic
      : FUENTES.calibriBold
    : opts.italic
      ? FUENTES.calibriItalic
      : FUENTES.calibri;
  const size = opts.size ?? 9.75;
  doc.font(f).fontSize(size).fillColor('black');
  doc.text(texto ?? '', x + u(2), y + 0.5, {
    width: Math.max(w - u(4), 1),
    align: opts.align ?? 'left',
    lineBreak: false,
    ellipsis: true,
    height: size * 1.4,
  });
}
