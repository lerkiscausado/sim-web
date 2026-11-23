export interface PacienteEndoscopia {
    id: number;
    identificacion: string;
    idTipoIdentificacion: string;
    primerNombre: string;
    segundoNombre?: string | null;
    primerApellido: string;
    segundoApellido?: string | null;
    sexo: string;
    fechaNacimiento: string;
    telefono?: string | null;
    correoElectronico?: string | null;
}

export interface OrdenPendiente {
    idDetalleOrden: number;
    idOrden: number;
    consecutivo: string;
    numeroOrden: string;
    fechaIngreso: string;
    idUsuario: number;
    idTipoEstudio?: number;
    estudio: string;
    nombreCups: string;
    paciente: PacienteEndoscopia;
}

export interface EndoscopiaFirmada extends OrdenPendiente {
    idEndoscopia: number;
    fechaFirma: string | null;
    adendas: number;
}

export interface Adenda {
    id: number;
    texto: string;
    fechaHora: string;
    idUsuario: number | null;
    autor: string | null;
}

export interface EndoscopiaData {
    id?: number;
    idOrden: number;
    idDetalleOrden: number;
    fechaEstudio: string;
    fechaSalida?: string | null;
    medicoSolicita: string;
    indicacion: string;
    medicamentos?: string | null;
    idEquipo?: number;
    idProcedimientoTerapeutico?: number;
    anestesiologo?: string | null;
    campo1: string;
    campo2?: string | null;
    campo3?: string | null;
    campo4?: string | null;
    campo5?: string | null;
    campo6?: string | null;
    diagnostico: string;
    codigoDiagnostico?: string | null;
    tomaBiopsia?: "NO" | "SI" | null;
    biopsia?: string | null;
    firmada?: boolean;
    fechaFirma?: string | null;
}

/** Campos que acepta POST /atenciones/endoscopias (el backend rechaza cualquier otro). */
export const CAMPOS_EDITABLES_ENDOSCOPIA = [
    "idOrden", "idDetalleOrden", "fechaEstudio", "fechaSalida", "medicoSolicita", "indicacion", "medicamentos",
    "idEquipo", "idProcedimientoTerapeutico", "anestesiologo", "campo1", "campo2", "campo3", "campo4", "campo5",
    "campo6", "diagnostico", "codigoDiagnostico", "tomaBiopsia", "biopsia",
] as const;

/** Pestañas según el tipo de estudio, como Nuevo() de frmEndoscopiaGL (ELCB solo en colonoscopia). */
export function pestanasPorEstudio(estudio?: string | null) {
    const t = (estudio ?? "").toUpperCase();
    if (t.includes("COLONOSCOPIA")) return { campo2: "Inspección", campo3: "Tacto", campo4: "Colonoscopia", elcb: true };
    if (t.includes("RECTOSCOPIA")) return { campo2: "Inspección", campo3: "Tacto", campo4: "Rectoscopia", elcb: false };
    return { campo2: "Esófago", campo3: "Estómago", campo4: "Duodeno", elcb: false };
}

export interface EstudioAnterior {
    id: number;
    idOrden: number;
    consecutivo: string;
    numeroOrden: string;
    fechaIngreso: string;
    estudio: string | null;
    campo1: string | null;
    diagnostico: string | null;
}

export function nombrePaciente(p?: PacienteEndoscopia) {
    if (!p) return "—";
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
        .filter(Boolean)
        .join(" ");
}


/** Utilidades de fecha en hora local (ver lib/fechas.ts). */
export { calcularEdad } from "@/lib/fechas";
