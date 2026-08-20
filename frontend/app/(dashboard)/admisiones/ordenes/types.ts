export interface PacienteBusqueda {
    id: number;
    idTipoIdentificacion: string;
    identificacion: string;
    primerNombre: string;
    segundoNombre: string | null;
    primerApellido: string;
    segundoApellido: string | null;
}

export interface LookupItem {
    id: number | string;
    nombre: string;
}

export interface Contrato {
    id: number;
    nombre: string;
    codigoEntidad: string;
    entidad?: { nombreEntidad: string };
}

export interface Sede {
    id: number;
    nombre: string;
}

export interface Especimen {
    id: number;
    nombre: string;
}

export interface CupsItem {
    codigoCups: string;
    nombreCups: string;
}

export interface Empleado {
    id: number;
    nombreEmpleado: string;
    cargo?: { nombreCargo: string };
}

export interface Orden {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    fechaOrden: string;
    estado: string;
    idContrato: number;
    idTipoEstudio: number;
}

export interface DetalleOrden {
    id: number;
    codigoCups: string;
    diagnostico1: string | null;
    tipo: string;
    valor: number;
    copago: number | null;
    neto: number | null;
    estado: string;
    cups?: CupsItem;
}

/** Suma N días hábiles (lunes a viernes) a una fecha ISO — para previsualizar Fecha Entrega. */
export function sumarDiasHabiles(fechaISO: string, dias: number): string {
    const fecha = new Date(fechaISO + "T00:00:00");
    let agregados = 0;
    while (agregados < dias) {
        fecha.setDate(fecha.getDate() + 1);
        const diaSemana = fecha.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) agregados++;
    }
    return fecha.toISOString().slice(0, 10);
}

export interface OrdenListado {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    comentarios: string | null;
    estado: string;
    paciente?: {
        id: number;
        identificacion: string;
        idTipoIdentificacion: string;
        primerNombre: string;
        segundoNombre: string | null;
        primerApellido: string;
        segundoApellido: string | null;
        sexo: string;
        fechaNacimiento: string;
        telefono: string | null;
    };
    contrato?: { nombre: string };
    tipoEstudio?: { nombreTipoEstudio: string };
    especimen?: { nombre: string };
    sede?: { nombre: string };
}

export function calcularEdad(fechaNacimientoISO: string): number {
    const nacimiento = new Date(fechaNacimientoISO);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

export interface OrdenListadoResult {
    data: OrdenListado[];
    total: number;
    page: number;
    pageSize: number;
}

export function nombrePaciente(p?: PacienteBusqueda | null) {
    if (!p) return "";
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}
