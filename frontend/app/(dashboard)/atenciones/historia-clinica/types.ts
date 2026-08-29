export interface PacienteHistoria {
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
    paciente: PacienteHistoria;
}

export interface HistoriaClinicaData {
    id?: number;
    idOrden: number;
    idDetalleOrden: number;
    responsables?: string | null;
    motivoConsulta?: string | null;
    consultaControl?: string | null;
    enfermedadActual?: string | null;
    examenFisico?: string | null;
    peso?: number | null;
    talla?: number | null;
    tensionArterial?: string | null;
    frecuenciaCardiaca?: string | null;
    frecuenciaRespiratoria?: string | null;
    temperatura?: string | null;
    diagnostico?: string | null;
    planSeguir?: string | null;
    formulacion?: string | null;
    laboratorios?: string | null;
    otrosEstudios?: string | null;
    recomendaciones?: string | null;
    estado?: string | null;
}

export interface ItemDiagnostico {
    idDiagnostico: string;
    descripcion: string | null;
    nombre: string | null;
}

export interface ItemMedicamento {
    idMedicamento: number;
    idViaAdministracion: number;
    dosis: string;
    cantidad: string;
    descripcion: string;
    nombreMedicamento: string | null;
    nombreViaAdministracion: string | null;
}

export interface ItemCups {
    codigoCups: string;
    descripcion: string | null;
    nombre: string | null;
}

export interface ItemRxs {
    idRxs: number;
    descripcion: string;
    nombre: string | null;
}

export interface EstudioAnterior {
    id: number;
    idOrden: number;
    consecutivo: string;
    numeroOrden: string;
    fechaIngreso: string;
    estudio: string | null;
    diagnostico: string | null;
    motivoConsulta: string | null;
}

export function nombrePaciente(p?: PacienteHistoria) {
    if (!p) return "—";
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
        .filter(Boolean)
        .join(" ");
}

export function calcularEdad(fechaNacimientoISO: string): number {
    const nacimiento = new Date(fechaNacimientoISO);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}
