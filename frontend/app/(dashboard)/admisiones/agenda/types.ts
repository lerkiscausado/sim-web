export type EstadoAgenda = "CANCELADA" | "ATENDIDA" | "APARTADA" | "DISPONIBLE";

export interface CitaAgenda {
    id: number;
    fecha: string;
    fechaAgenda: string;
    fechaSolicitada: string;
    hora: string;
    idUsuario?: number | null;
    idTipoEstudio: number;
    idContrato: number;
    nota?: string | null;
    idEmpleado?: number | null;
    idEspecialista: number;
    idOrden: number;
    estado: EstadoAgenda;
    codigoCups: string;
    nombreCups: string;
    paciente?: { id: number; primerNombre: string; primerApellido: string } | null;
    especialista?: { id: number; nombre: string } | null;
    tipoEstudio?: { id: number; nombreTipoEstudio?: string } | null;
}

export interface CreateAgendaPayload {
    fecha: string;
    fechaAgenda: string;
    fechaSolicitada: string;
    hora: string;
    idUsuario?: number;
    idTipoEstudio: number;
    idContrato: number;
    nota?: string;
    idEmpleado?: number;
    idEspecialista: number;
    idOrden: number;
    codigoCups: string;
    nombreCups: string;
}
