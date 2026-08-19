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

export interface Orden {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    estado: string;
    idContrato: number;
    idTipoEstudio: number;
}

export interface DetalleOrden {
    id: number;
    codigoCups: string;
    diagnostico1: string;
    tipo: string;
    valor: number;
    copago: number | null;
    neto: number | null;
    estado: string;
    cups?: CupsItem;
}

export interface OrdenListado {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    estado: string;
    paciente?: { identificacion: string; primerNombre: string; primerApellido: string };
    contrato?: { nombre: string };
    tipoEstudio?: { nombreTipoEstudio: string };
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
