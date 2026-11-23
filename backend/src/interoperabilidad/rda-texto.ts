/**
 * Convierte los antecedentes en texto libre (tabla `antecedentes`) en listas para el
 * RDA-Paciente. Mejor esfuerzo por palabras clave, igual que RDATextParser.vb: se envía
 * como texto narrativo (CodeableConcept.text), sin inventar códigos.
 */
const PALABRAS_ALERGIA = ['alerg', 'hipersensib', 'reaccion adversa', 'reacción adversa', 'intoleran'];
const PALABRAS_MEDICAMENTO = [
  'toma ', 'tomando', 'medicamento', 'formula', 'fórmula', 'farmac', 'fármac', 'consume ',
  'tratamiento con', 'mg', 'tableta', 'capsula', 'cápsula', 'jarabe', 'inyect',
];
const NEGATIVOS = [
  'ninguno', 'ninguna', 'no refiere', 'no manifiesta', 'niega', 'sin antecedentes', 'n/a', 'no aplica', 'no presenta',
];

export function dividirEnItems(texto?: string | null): string[] {
  if (!texto || !texto.trim()) return [];
  return texto
    .split(/[;\r\n]+/)
    .flatMap((parte) => parte.split(','))
    .map((s) => s.trim())
    .filter(Boolean);
}

export function clasificarAntecedentesPersonales(texto?: string | null) {
  const alergias: string[] = [];
  const medicamentos: string[] = [];
  const condiciones: string[] = [];
  for (const item of dividirEnItems(texto)) {
    const l = item.toLowerCase();
    if (NEGATIVOS.some((n) => l.includes(n))) continue;
    if (PALABRAS_ALERGIA.some((p) => l.includes(p))) alergias.push(item);
    else if (PALABRAS_MEDICAMENTO.some((p) => l.includes(p))) medicamentos.push(item);
    else condiciones.push(item);
  }
  return { alergias, medicamentos, condiciones };
}

export function extraerAntecedentesFamiliares(texto?: string | null): string[] {
  return dividirEnItems(texto).filter((i) => !NEGATIVOS.some((n) => i.toLowerCase().includes(n)));
}

/** ParentescoAntecedente solo tiene 01 Padres, 02 Hermanos, 03 Tíos, 04 Abuelos. */
export function detectarParentesco(texto: string): { codigo: string; display: string } | null {
  const t = texto.toLowerCase();
  if (/padre|madre|papá|papa|mamá|mama/.test(t)) return { codigo: '01', display: 'Padres' };
  if (/herman/.test(t)) return { codigo: '02', display: 'Hermanos' };
  if (/\bt[ií]os?\b|\bt[ií]as?\b/.test(t)) return { codigo: '03', display: 'Tíos' };
  if (/abuel/.test(t)) return { codigo: '04', display: 'Abuelos' };
  return null;
}
