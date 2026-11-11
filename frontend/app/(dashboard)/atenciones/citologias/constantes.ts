import { hoyISO } from "@/lib/fechas";

export type ChecksState = Record<string, boolean>;

export const CALIDAD_MUESTRA = [
    { key: "cm1", label: "Satisfactoria Zona de Transformación Presente" },
    { key: "cm2", label: "Satisfactoria Zona de Transformación Ausente" },
    { key: "cm3", label: "Insatisfactoria" },
    { key: "cm4", label: "Rechazada" },
];

export const CATEGORIZACION_GENERAL = [
    { key: "cg1", label: "Negativa para Lesión Intraepitelial o Malignidad" },
    { key: "cg2", label: "Anormalidad de Células Epiteliales" },
];

export const MICROORGANISMOS = [
    { key: "m1", label: "Bacterias con Morfologías compatibles con Actynomices" },
    { key: "m2", label: "Cambios Celulares Compatibles al Herpes Virus Simple" },
    { key: "m3", label: "Trichomonas Vaginalis" },
    { key: "m4", label: "Candidiasis Vaginalis" },
    { key: "m5", label: "Vaginosis Bacteriana" },
    { key: "m6", label: "Otros Cambios" },
];

export const OHNN = [
    { key: "ohnn1", label: "Inflamación" },
    { key: "ohnn2", label: "Radiación" },
    { key: "ohnn3", label: "Cambios por DIU" },
    { key: "ohnn4", label: "Células Endometriales Después de los 40 años" },
    { key: "ohnn5", label: "Células Glandulares Posthisterectomía" },
    { key: "ohnn6", label: "Atrofia" },
];

export const CELULAS_ESCAMOSAS = [
    { key: "ace1", label: "De Significado Indeterminado (ASC-US)" },
    { key: "ace2", label: "No se Descarta Lesión Intraepitelial Escamosa de Alto Grado (ASC-H)" },
    { key: "ace3", label: "Lesión Intraepitelial Escamosa de Bajo Grado LIE BG (Comprende Infección por el VPH y NIC I)" },
    { key: "ace4", label: "Lesión Intraepitelial Escamosa de Alto Grado LIE AG (Comprende NIC II Y NIC III y Carcinoma in Situ)" },
    { key: "ace5", label: "Carcinoma Escamocelular" },
];

export const CELULAS_GLANDULARES_ATIPICAS = [
    { key: "acg1", label: "Endocervicales" },
    { key: "acg2", label: "Endometriales" },
];

export const CELULAS_GLANDULARES_NEOPLASIA = [
    { key: "acg3", label: "Endocervicales" },
    { key: "acg4", label: "Endometriales" },
];

export const CELULAS_GLANDULARES_OTROS = [
    { key: "acg5", label: "Adenocarcinoma IN SITU" },
    { key: "acg8", label: "Otros" },
];

export const FLORA_BACILAR = [
    { key: "fb1", label: "Escasa" },
    { key: "fb2", label: "Moderada" },
    { key: "fb3", label: "Aumentada" },
];

export const INFLAMACION = [
    { key: "i1", label: "Leve" },
    { key: "i2", label: "Moderada" },
    { key: "i3", label: "Severa" },
];

export const TODOS_LOS_CHECKS = [
    ...CALIDAD_MUESTRA,
    ...CATEGORIZACION_GENERAL,
    ...MICROORGANISMOS,
    ...OHNN,
    ...CELULAS_ESCAMOSAS,
    ...CELULAS_GLANDULARES_ATIPICAS,
    ...CELULAS_GLANDULARES_NEOPLASIA,
    ...CELULAS_GLANDULARES_OTROS,
    ...FLORA_BACILAR,
    ...INFLAMACION,
].map((c) => c.key);

export const CUELLO = [
    { key: "s", label: "Sano" },
    { key: "u", label: "Ulcerado" },
    { key: "l", label: "Lacerado" },
];

export const FLUJO = [
    { key: "bn", label: "Blanco" },
    { key: "cn", label: "Claro" },
    { key: "ba", label: "Amarillo" },
    { key: "o", label: "Con Olor" },
];

export const FORM_INICIAL = {
    checks: Object.fromEntries(TODOS_LOS_CHECKS.map((k) => [k, false])) as ChecksState,
    cm5: "",
    observaciones: "",
    diagnostico: "",
    fechaSalida: hoyISO(),
};

export const ANTECEDENTES_INICIAL = {
    g: "",
    p: "",
    a: "",
    c: "",
    ivsa: "",
    mpf: "",
    fum: "",
    fuc: "",
    fup: "",
    checks: { s: false, u: false, l: false, bn: false, cn: false, ba: false, o: false } as ChecksState,
    observaciones: "",
};
