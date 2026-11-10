/**
 * Casillas del formulario frmCitologiaGeneral (Properties.Caption del
 * .Designer.vb), agrupadas como en pantalla. Se usan para el informe PDF.
 */
export interface GrupoCitologia {
  titulo: string;
  subtitulo?: string;
  campos: { key: string; label: string }[];
}

export const GRUPOS_CITOLOGIA: GrupoCitologia[] = [
  {
    titulo: 'CALIDAD DE LA MUESTRA',
    campos: [
      { key: 'cm1', label: 'Satisfactoria Zona de Transformación Presente' },
      { key: 'cm2', label: 'Satisfactoria Zona de Transformación Ausente' },
      { key: 'cm3', label: 'Insatisfactoria' },
      { key: 'cm4', label: 'Rechazada' },
    ],
  },
  {
    titulo: 'CATEGORIZACIÓN GENERAL',
    campos: [
      { key: 'cg1', label: 'Negativa para Lesión Intraepitelial o Malignidad' },
      { key: 'cg2', label: 'Anormalidad de Células Epiteliales' },
    ],
  },
  {
    titulo: 'MICROORGANISMOS',
    campos: [
      {
        key: 'm1',
        label: 'Bacterias con Morfologías compatibles con Actynomices',
      },
      {
        key: 'm2',
        label: 'Cambios Celulares Compatibles al Herpes Virus Simple',
      },
      { key: 'm3', label: 'Trichomonas Vaginalis' },
      { key: 'm4', label: 'Candidiasis Vaginalis' },
      { key: 'm5', label: 'Vaginosis Bacteriana' },
      { key: 'm6', label: 'Otros Cambios' },
    ],
  },
  {
    titulo: 'OTROS HALLAZGOS NO NEOPLÁSICOS (cambios reactivos asociados a:)',
    campos: [
      { key: 'ohnn1', label: 'Inflamación' },
      { key: 'ohnn2', label: 'Radiación' },
      { key: 'ohnn3', label: 'Cambios por DIU' },
      { key: 'ohnn4', label: 'Células Endometriales Después de los 40 años' },
      { key: 'ohnn5', label: 'Células Glandulares Posthisterectomía' },
      { key: 'ohnn6', label: 'Atrofia' },
    ],
  },
  {
    titulo: 'ANORMALIDADES EN CÉLULAS ESCAMOSAS (ASC)',
    campos: [
      { key: 'ace1', label: 'De Significado Indeterminado (ASC-US)' },
      {
        key: 'ace2',
        label:
          'No se Descarta Lesión Intraepitelial Escamosa de Alto Grado (ASC-H)',
      },
      {
        key: 'ace3',
        label:
          'Lesión Intraepitelial Escamosa de Bajo Grado LIE BG (Comprende Infección por el VPH y NIC I)',
      },
      {
        key: 'ace4',
        label:
          'Lesión Intraepitelial Escamosa de Alto Grado LIE AG (Comprende NIC II Y NIC III y Carcinoma in Situ)',
      },
      { key: 'ace5', label: 'Carcinoma Escamocelular' },
    ],
  },
  {
    titulo: 'ANORMALIDADES EN CÉLULAS GLANDULARES (AGC)',
    subtitulo: 'Células Glandulares Atípicas (AGC)',
    campos: [
      { key: 'acg1', label: 'Endocervicales' },
      { key: 'acg2', label: 'Endometriales' },
    ],
  },
  {
    titulo: 'ANORMALIDADES EN CÉLULAS GLANDULARES (AGC)',
    subtitulo: 'Células Glandulares Atípicas a Favor de Neoplasia',
    campos: [
      { key: 'acg3', label: 'Endocervicales' },
      { key: 'acg4', label: 'Endometriales' },
    ],
  },
  {
    titulo: 'ANORMALIDADES EN CÉLULAS GLANDULARES (AGC)',
    campos: [
      { key: 'acg5', label: 'Adenocarcinoma IN SITU' },
      { key: 'acg8', label: 'Otros' },
    ],
  },
  {
    titulo: 'FLORA BACILAR',
    campos: [
      { key: 'fb1', label: 'Escasa' },
      { key: 'fb2', label: 'Moderada' },
      { key: 'fb3', label: 'Aumentada' },
    ],
  },
  {
    titulo: 'INFLAMACIÓN',
    campos: [
      { key: 'i1', label: 'Leve' },
      { key: 'i2', label: 'Moderada' },
      { key: 'i3', label: 'Severa' },
    ],
  },
];

/** Todas las casillas char(1) de la tabla citologia. */
export const CAMPOS_CHECK_CITOLOGIA = [
  'cm1',
  'cm2',
  'cm3',
  'cm4',
  'cg1',
  'cg2',
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'ohnn1',
  'ohnn2',
  'ohnn3',
  'ohnn4',
  'ohnn5',
  'ohnn6',
  'ace1',
  'ace2',
  'ace3',
  'ace4',
  'ace5',
  'acg1',
  'acg2',
  'acg3',
  'acg4',
  'acg5',
  'acg6',
  'acg7',
  'acg8',
  'fb1',
  'fb2',
  'fb3',
  'i1',
  'i2',
  'i3',
] as const;

/**
 * El VB.NET (CambiarValor) guarda una casilla marcada como 'X' y una vacía
 * como ''. La API web trabaja con '1'/'0'; estas funciones traducen en ambos
 * sentidos para que los datos sigan siendo compatibles con el escritorio.
 */
export const aBd = (v: string | undefined | null) =>
  v === '1' || v === 'X' || v === 'x' ? 'X' : '';
export const aApi = (v: string | undefined | null) =>
  v === 'X' || v === 'x' || v === '1' ? '1' : '0';
