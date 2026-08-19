export interface OrdenPendiente {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    idEspecimen: number;
    idUsuario: number;
    paciente?: {
        id: number;
        identificacion: string;
        primerNombre: string;
        segundoNombre?: string | null;
        primerApellido: string;
        segundoApellido?: string | null;
    };
    especimen?: { id: number; nombre: string };
    tipoEstudio?: { id: number; nombreTipoEstudio: string };
}

export interface Especimen {
    id: number;
    nombre: string;
}

export interface PlantillaPatologia {
    id: number;
    nombre: string;
    macro: string;
    micro: string;
    diagnostico: string;
}

export interface DiagnosticoCie10 {
    codigoDiagnostico: string;
    nombreDiagnostico: string | null;
}

export interface InformePatologia {
    id: number;
    idOrden: number;
    fecha: string;
    fechaSalida: string;
    tipoMuestra: string;
    sitioLesion: string;
    solicitado: string;
    descripcionMacroscopica: string;
    descripcionMicroscopica: string;
    diagnostico: string;
    observaciones: string;
    codigoDiagnostico: string;
    idEmpleado: number;
    codigoPatologia?: string | null;
}

export interface UpsertPatologiaPayload {
    idOrden: number;
    tipoMuestra: string;
    sitioLesion: string;
    solicitado: string;
    descripcionMacroscopica: string;
    descripcionMicroscopica: string;
    diagnostico: string;
    observaciones?: string;
    codigoDiagnostico: string;
    idEspecimen?: number;
    codigoPatologia?: string;
}

export function nombrePaciente(p?: OrdenPendiente["paciente"]) {
    if (!p) return "—";
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
        .filter(Boolean)
        .join(" ");
}
