import { fuente } from './pdf-utils';

/**
 * Renderizador mínimo de HTML a pdfkit para el texto enriquecido de los
 * informes (patologia.DIAGNOSTICO). El VB.NET lo guarda con el RichEditControl
 * de DevExpress (HtmlText) y el reporte lo pinta con XRRichText; aquí se
 * soporta lo que ese editor produce y lo que produce el editor web:
 * párrafos con alineación y márgenes, negrita/cursiva/subrayado, tamaño y
 * color de fuente, listas numeradas/viñetas anidadas y saltos de línea.
 */

type Nodo =
  | { tipo: 'texto'; texto: string }
  | { tipo: 'elem'; tag: string; attrs: Record<string, string>; hijos: Nodo[] };

const VACIOS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'col']);
const IGNORAR = new Set(['head', 'style', 'script', 'title']);

const ENTIDADES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  ntilde: 'ñ',
  Ntilde: 'Ñ',
  uuml: 'ü',
  Uuml: 'Ü',
  iexcl: '¡',
  iquest: '¿',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  laquo: '«',
  raquo: '»',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  bull: '•',
  middot: '·',
  deg: '°',
  plusmn: '±',
  times: '×',
  micro: 'µ',
  ordm: 'º',
  ordf: 'ª',
  sup2: '²',
  sup3: '³',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  copy: '©',
  reg: '®',
  euro: '€',
};

export function decodificarEntidades(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const cp =
        e[1] === 'x' || e[1] === 'X'
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return ENTIDADES[e] ?? ENTIDADES[e.toLowerCase()] ?? m;
  });
}

function parsearAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)))
    attrs[m[1].toLowerCase()] = decodificarEntidades(
      m[2] ?? m[3] ?? m[4] ?? '',
    );
  return attrs;
}

export function parsearHtml(html: string): Nodo[] {
  const raiz: Nodo = { tipo: 'elem', tag: '#root', attrs: {}, hijos: [] };
  const pila: Extract<Nodo, { tipo: 'elem' }>[] = [
    raiz as Extract<Nodo, { tipo: 'elem' }>,
  ];
  const re =
    /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  let ignorando: string | null = null;
  while ((m = re.exec(html))) {
    const [token, tagNombre, resto, texto] = m;
    if (ignorando) {
      if (
        tagNombre &&
        token.startsWith('</') &&
        tagNombre.toLowerCase() === ignorando
      )
        ignorando = null;
      continue;
    }
    if (texto !== undefined) {
      pila[pila.length - 1].hijos.push({
        tipo: 'texto',
        texto: decodificarEntidades(texto),
      });
      continue;
    }
    if (!tagNombre) continue;
    const tag = tagNombre.toLowerCase();
    if (token.startsWith('</')) {
      for (let i = pila.length - 1; i > 0; i--) {
        if (pila[i].tag === tag) {
          pila.length = i;
          break;
        }
      }
      continue;
    }
    if (IGNORAR.has(tag)) {
      if (!/\/\s*$/.test(resto)) ignorando = tag;
      continue;
    }
    const nodo = {
      tipo: 'elem' as const,
      tag,
      attrs: parsearAttrs(resto),
      hijos: [] as Nodo[],
    };
    pila[pila.length - 1].hijos.push(nodo);
    if (!VACIOS.has(tag) && !/\/\s*$/.test(resto)) pila.push(nodo);
  }
  return (raiz as Extract<Nodo, { tipo: 'elem' }>).hijos;
}

function estilos(attrs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of (attrs.style ?? '').split(';')) {
    const i = decl.indexOf(':');
    if (i > 0)
      out[decl.slice(0, i).trim().toLowerCase()] = decl
        .slice(i + 1)
        .trim()
        .toLowerCase();
  }
  return out;
}

/** Convierte una longitud CSS (pt, px, em, in, cm) a puntos. */
function aPuntos(v: string | undefined, base = 10): number | undefined {
  if (!v) return undefined;
  const m = /^(-?[\d.]+)\s*(pt|px|em|rem|in|cm|mm|%)?$/.exec(v.trim());
  if (!m) return undefined;
  const n = parseFloat(m[1]);
  switch (m[2]) {
    case 'px':
      return n * 0.75;
    case 'em':
    case 'rem':
      return n * base;
    case 'in':
      return n * 72;
    case 'cm':
      return (n * 72) / 2.54;
    case 'mm':
      return (n * 72) / 25.4;
    case '%':
      return (n / 100) * base;
    default:
      return n;
  }
}

/** margin: 1-4 valores → [top, right, bottom, left] en puntos. */
function margenes(
  st: Record<string, string>,
  base: number,
): [number, number, number, number] {
  let r: [number, number, number, number] = [0, 0, 0, 0];
  if (st.margin) {
    const v = st.margin.split(/\s+/).map((x) => aPuntos(x, base) ?? 0);
    if (v.length === 1) r = [v[0], v[0], v[0], v[0]];
    else if (v.length === 2) r = [v[0], v[1], v[0], v[1]];
    else if (v.length === 3) r = [v[0], v[1], v[2], v[1]];
    else r = [v[0], v[1], v[2], v[3]];
  }
  const t = aPuntos(st['margin-top'], base);
  const rr = aPuntos(st['margin-right'], base);
  const b = aPuntos(st['margin-bottom'], base);
  const l = aPuntos(st['margin-left'], base);
  if (t !== undefined) r[0] = t;
  if (rr !== undefined) r[1] = rr;
  if (b !== undefined) r[2] = b;
  if (l !== undefined) r[3] = l;
  return r;
}

function colorCss(v: string | undefined): string | undefined {
  if (!v || v === 'transparent' || v === 'inherit') return undefined;
  if (/^#[0-9a-f]{3,6}$/i.test(v)) return v;
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v);
  if (m)
    return (
      '#' +
      [m[1], m[2], m[3]]
        .map((x) => Number(x).toString(16).padStart(2, '0'))
        .join('')
    );
  return [
    'black',
    'red',
    'blue',
    'green',
    'gray',
    'grey',
    'maroon',
    'navy',
  ].includes(v)
    ? v
    : undefined;
}

interface Estilo {
  familia: 'calibri' | 'arial';
  tamano: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
}

interface Run extends Estilo {
  texto: string;
}

interface Parrafo {
  runs: Run[];
  align: 'left' | 'center' | 'right' | 'justify';
  sangria: number;
  margenArriba: number;
  margenAbajo: number;
  prefijo?: string;
}

export interface OpcionesHtml {
  familia?: 'calibri' | 'arial';
  tamano?: number;
  bold?: boolean;
  /** Separación entre párrafos que no declaran margen (pt). */
  espacioParrafo?: number;
}

function heredar(
  e: Estilo,
  attrs: Record<string, string>,
  tag: string,
): Estilo {
  const st = estilos(attrs);
  const n = { ...e };
  if (tag === 'b' || tag === 'strong' || /^h[1-6]$/.test(tag)) n.bold = true;
  if (tag === 'i' || tag === 'em') n.italic = true;
  if (tag === 'u') n.underline = true;
  if (st['font-weight'])
    n.bold =
      st['font-weight'] === 'bold' ||
      st['font-weight'] === 'bolder' ||
      Number(st['font-weight']) >= 600;
  if (st['font-style'])
    n.italic = st['font-style'] === 'italic' || st['font-style'] === 'oblique';
  if (st['text-decoration'])
    n.underline = st['text-decoration'].includes('underline');
  if (st['font-family'])
    n.familia =
      /arial|helvetica|sans-serif/.test(st['font-family']) &&
      !/calibri/.test(st['font-family'])
        ? 'arial'
        : 'calibri';
  const tam = aPuntos(st['font-size'], e.tamano);
  if (tam && tam > 3 && tam < 72) n.tamano = tam;
  const c = colorCss(st.color);
  if (c) n.color = c;
  return n;
}

const BLOQUES = new Set([
  'p',
  'div',
  'li',
  'ol',
  'ul',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'table',
  'tr',
  'body',
  'html',
]);

/** Aplana el árbol en párrafos con runs de estilo uniforme. */
function aParrafos(
  nodos: Nodo[],
  base: Estilo,
  espacioParrafo: number,
): Parrafo[] {
  const out: Parrafo[] = [];
  let actual: Parrafo | null = null;

  const nuevo = (p: Partial<Parrafo>) => {
    cerrar();
    actual = {
      runs: [],
      align: 'left',
      sangria: 0,
      margenArriba: 0,
      margenAbajo: 0,
      ...p,
    };
  };
  const cerrar = () => {
    if (actual && (actual.runs.some((r) => r.texto.trim()) || actual.prefijo))
      out.push(actual);
    actual = null;
  };

  const recorrer = (
    lista: Nodo[],
    est: Estilo,
    ctx: {
      sangria: number;
      align: Parrafo['align'];
      listas: { tipo: 'ol' | 'ul'; n: number }[];
    },
  ) => {
    for (const nodo of lista) {
      if (nodo.tipo === 'texto') {
        const texto = nodo.texto.replace(/[\r\n\t]+/g, ' ');
        if (!texto) continue;
        if (!actual) nuevo({ align: ctx.align, sangria: ctx.sangria });
        actual!.runs.push({ ...est, texto });
        continue;
      }
      const { tag, attrs, hijos } = nodo;
      if (tag === 'br') {
        const previo: Parrafo | null = actual;
        cerrar();
        nuevo({
          align: previo?.align ?? ctx.align,
          sangria: previo?.sangria ?? ctx.sangria,
        });
        actual!.runs.push({ ...est, texto: '' });
        continue;
      }
      if (tag === 'img' || tag === 'hr') continue;
      const est2 = heredar(est, attrs, tag);
      const st = estilos(attrs);
      if (!BLOQUES.has(tag)) {
        recorrer(hijos, est2, ctx);
        continue;
      }
      const [mt, , mb, ml] = margenes(st, est2.tamano);
      const align = (
        ['left', 'center', 'right', 'justify'].includes(st['text-align'])
          ? st['text-align']
          : ctx.align
      ) as Parrafo['align'];
      if (tag === 'ol' || tag === 'ul') {
        cerrar();
        const inicio = Number(attrs.start) || 1;
        const sang = ctx.sangria + (ml > 0 ? ml : 18);
        recorrer(hijos, est2, {
          sangria: sang,
          align,
          listas: [...ctx.listas, { tipo: tag, n: inicio - 1 }],
        });
        cerrar();
        continue;
      }
      if (tag === 'li') {
        const lst = ctx.listas[ctx.listas.length - 1];
        let prefijo = '•';
        if (lst) {
          lst.n += 1;
          prefijo = lst.tipo === 'ol' ? `${lst.n}.` : '•';
        }
        nuevo({
          align,
          sangria: ctx.sangria,
          margenArriba: mt,
          margenAbajo: mb,
          prefijo,
        });
        // Un <p> dentro del <li> continúa la misma línea del ítem.
        const hijosSinP =
          hijos.length === 1 && hijos[0].tipo === 'elem' && hijos[0].tag === 'p'
            ? hijos[0].hijos
            : hijos;
        recorrer(hijosSinP, est2, { ...ctx, align });
        cerrar();
        continue;
      }
      const tieneMargen =
        st.margin !== undefined ||
        st['margin-top'] !== undefined ||
        st['margin-bottom'] !== undefined;
      nuevo({
        align,
        sangria: ctx.sangria + ml,
        margenArriba: mt,
        margenAbajo: tag === 'p' && !tieneMargen ? espacioParrafo : mb,
      });
      recorrer(hijos, est2, { ...ctx, sangria: ctx.sangria + ml, align });
      cerrar();
    }
  };

  recorrer(nodos, base, { sangria: 0, align: 'left', listas: [] });
  cerrar();
  // Colapsa espacios repetidos dentro de cada párrafo (como hace el navegador).
  for (const p of out) {
    let previoEspacio = true;
    for (const r of p.runs) {
      let t = r.texto.replace(/ {2,}/g, ' ');
      if (previoEspacio) t = t.replace(/^ /, '');
      previoEspacio = t.endsWith(' ') || (t === '' && previoEspacio);
      r.texto = t;
    }
    const ultimo = p.runs[p.runs.length - 1];
    if (ultimo) ultimo.texto = ultimo.texto.replace(/\s+$/, '');
  }
  return out;
}

/** true si el HTML no tiene texto visible. */
export function htmlVacio(html: string | null | undefined): boolean {
  if (!html) return true;
  return !htmlATexto(html).trim();
}

/** Texto plano del HTML (para listados, correos y validaciones). */
export function htmlATexto(html: string | null | undefined): string {
  if (!html) return '';
  const pars = aParrafos(
    parsearHtml(html),
    {
      familia: 'calibri',
      tamano: 10,
      bold: false,
      italic: false,
      underline: false,
      color: 'black',
    },
    0,
  );
  return pars
    .map(
      (p) =>
        (p.prefijo ? `${p.prefijo} ` : '') +
        p.runs.map((r) => r.texto).join(''),
    )
    .join('\n')
    .replace(/ /g, ' ');
}

/**
 * Dibuja el HTML en el documento desde (x, doc.y) con el ancho dado. Respeta
 * los saltos de página automáticos de pdfkit (márgenes del documento).
 */
export function renderHtml(
  doc: PDFKit.PDFDocument,
  html: string,
  x: number,
  ancho: number,
  opciones: OpcionesHtml = {},
) {
  const base: Estilo = {
    familia: opciones.familia ?? 'arial',
    tamano: opciones.tamano ?? 9.75,
    bold: opciones.bold ?? false,
    italic: false,
    underline: false,
    color: 'black',
  };
  const parrafos = aParrafos(
    parsearHtml(html || ''),
    base,
    opciones.espacioParrafo ?? 0,
  );
  for (const p of parrafos) {
    if (p.margenArriba) doc.y += p.margenArriba;
    const runs = p.runs.filter(
      (r, i) => r.texto !== '' || p.runs.length === 1 || i === 0,
    );
    const primer = runs[0] ?? { ...base, texto: '' };
    const altoLinea = doc
      .font(fuente(primer.familia, primer.bold, primer.italic))
      .fontSize(primer.tamano)
      .currentLineHeight(true);
    // Salto de página manual si ni siquiera cabe la primera línea.
    if (doc.y + altoLinea > doc.page.height - doc.page.margins.bottom)
      doc.addPage();

    let xTexto = x + p.sangria;
    let anchoTexto = Math.max(ancho - p.sangria, 40);
    if (p.prefijo) {
      const yItem = doc.y;
      doc
        .font(fuente(primer.familia, primer.bold, primer.italic))
        .fontSize(primer.tamano)
        .fillColor(primer.color);
      doc.text(p.prefijo, xTexto - 14, yItem, {
        width: 13,
        align: 'right',
        lineBreak: false,
      });
      doc.y = yItem;
      xTexto += 4;
      anchoTexto -= 4;
    }
    const conTexto = runs.filter((r) => r.texto !== '');
    if (conTexto.length === 0) {
      doc.y += altoLinea;
    } else {
      conTexto.forEach((r, i) => {
        doc
          .font(fuente(r.familia, r.bold, r.italic))
          .fontSize(r.tamano)
          .fillColor(r.color);
        const ultimo = i === conTexto.length - 1;
        const opts: PDFKit.Mixins.TextOptions = {
          width: anchoTexto,
          align: p.align,
          continued: !ultimo,
          underline: r.underline,
          lineGap: 0,
        };
        if (i === 0) doc.text(r.texto.replace(/ /g, ' '), xTexto, doc.y, opts);
        else doc.text(r.texto.replace(/ /g, ' '), opts);
      });
    }
    doc.fillColor('black');
    if (p.margenAbajo) doc.y += p.margenAbajo;
  }
}
