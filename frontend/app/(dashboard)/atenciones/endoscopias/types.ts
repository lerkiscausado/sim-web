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
    estudio: string;
    nombreCups: string;
    paciente: PacienteEndoscopia;
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
    campo6?: string | null;
    diagnostico: string;
    codigoDiagnostico?: string | null;
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


/** Plantillas reales del reporte según el tipo de estudio, extraídas de frmEndoscopia.vb (Nuevo()). */
export function plantillaPorEstudio(nombreTipoEstudio: string): string {
    const t = nombreTipoEstudio.toUpperCase();
    if (t.includes("COLONOSCOPIA") || t.includes("RECTOSCOPIA")) {
        return "INSPECCIÓN:\n\nTACTO RECTAL:\n\nENDOSCOPIA:\n\nDIAGNOSTICO ENDOSCOPICO:";
    }
    if (t.includes("ENDOSCOPIA")) {
        return "ESOFAGO:\n\nESTOMAGO:\n\nDUODENO:\n\nDIAGNOSTICO ENDOSCOPICO:";
    }
    return "";
}

/** Utilidades de fecha en hora local (ver lib/fechas.ts). */
export { calcularEdad } from "@/lib/fechas";
