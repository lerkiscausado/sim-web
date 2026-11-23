/**
 * Catálogos que pide el RDA (MinSalud) para el paciente. Mismos códigos y textos
 * que frmUsuarios del escritorio (GASTROLAP), que es lo que ya hay en la BD.
 */
export const PAISES_NACIMIENTO: { codigo: string; nombre: string }[] = [
    { codigo: "170", nombre: "Colombia" },
    { codigo: "862", nombre: "Venezuela" },
    { codigo: "218", nombre: "Ecuador" },
    { codigo: "604", nombre: "Perú" },
    { codigo: "076", nombre: "Brasil" },
    { codigo: "032", nombre: "Argentina" },
    { codigo: "152", nombre: "Chile" },
    { codigo: "068", nombre: "Bolivia" },
    { codigo: "600", nombre: "Paraguay" },
    { codigo: "858", nombre: "Uruguay" },
    { codigo: "591", nombre: "Panamá" },
    { codigo: "188", nombre: "Costa Rica" },
    { codigo: "340", nombre: "Honduras" },
    { codigo: "222", nombre: "El Salvador" },
    { codigo: "320", nombre: "Guatemala" },
    { codigo: "558", nombre: "Nicaragua" },
    { codigo: "192", nombre: "Cuba" },
    { codigo: "214", nombre: "República Dominicana" },
    { codigo: "484", nombre: "México" },
    { codigo: "840", nombre: "Estados Unidos" },
    { codigo: "124", nombre: "Canadá" },
    { codigo: "724", nombre: "España" },
    { codigo: "380", nombre: "Italia" },
    { codigo: "250", nombre: "Francia" },
    { codigo: "276", nombre: "Alemania" },
    { codigo: "826", nombre: "Reino Unido" },
    { codigo: "620", nombre: "Portugal" },
    { codigo: "156", nombre: "China" },
    { codigo: "356", nombre: "India" },
    { codigo: "999", nombre: "Otro país no listado" },
];

export const ETNIAS: { codigo: string; nombre: string }[] = [
    { codigo: "1", nombre: "Indígena" },
    { codigo: "2", nombre: "ROM (Gitano)" },
    { codigo: "3", nombre: "Raizal (Archipiélago San Andrés y Providencia)" },
    { codigo: "4", nombre: "Palenquero de San Basilio" },
    { codigo: "5", nombre: "Negro(a), mulato(a), afrocolombiano(a) o afrodescendiente" },
    { codigo: "6", nombre: "Otras etnias" },
    { codigo: "99", nombre: "Ninguna de las anteriores" },
];

export const DISCAPACIDADES: { codigo: string; nombre: string }[] = [
    { codigo: "01", nombre: "Discapacidad física" },
    { codigo: "02", nombre: "Discapacidad visual" },
    { codigo: "03", nombre: "Discapacidad auditiva" },
    { codigo: "04", nombre: "Discapacidad intelectual" },
    { codigo: "05", nombre: "Discapacidad sicosocial" },
    { codigo: "06", nombre: "Sordoceguera" },
    { codigo: "07", nombre: "Discapacidad múltiple" },
    { codigo: "08", nombre: "Sin discapacidad" },
];

export const IDENTIDADES_GENERO: { codigo: string; nombre: string }[] = [
    { codigo: "01", nombre: "Masculino" },
    { codigo: "02", nombre: "Femenino" },
    { codigo: "03", nombre: "Transgénero" },
    { codigo: "04", nombre: "Neutro" },
    { codigo: "05", nombre: "No lo declara" },
];
