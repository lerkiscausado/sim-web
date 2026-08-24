export interface OrdenPendiente {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    idEspecimen: number;
    idUsuario: number;
    tieneInforme?: boolean;
    paciente?: {
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
    };
    especimen?: { id: number; nombre: string };
    tipoEstudio?: { id: number; nombreTipoEstudio: string };
}

export interface InformeCitologia {
    id: number;
    idOrden: number;
    fecha: string;
    cm1?: string | null;
    cm2?: string | null;
    cm3?: string | null;
    cm4?: string | null;
    cm5?: string | null;
    cg1?: string | null;
    cg2?: string | null;
    m1?: string | null;
    m2?: string | null;
    m3?: string | null;
    m4?: string | null;
    m5?: string | null;
    m6?: string | null;
    ohnn1?: string | null;
    ohnn2?: string | null;
    ohnn3?: string | null;
    ohnn4?: string | null;
    ohnn5?: string | null;
    ohnn6?: string | null;
    ace1?: string | null;
    ace2?: string | null;
    ace3?: string | null;
    ace4?: string | null;
    ace5?: string | null;
    acg1?: string | null;
    acg2?: string | null;
    acg3?: string | null;
    acg4?: string | null;
    acg5?: string | null;
    acg8?: string | null;
    fb1: string;
    fb2: string;
    fb3: string;
    i1: string;
    i2: string;
    i3: string;
    observaciones?: string | null;
    diagnostico: string;
}

export interface UpsertCitologiaPayload extends Record<string, unknown> {
    idOrden: number;
}

export interface AntecedentesTomaMuestra {
    idUsuario: number;
    g?: string;
    p?: string;
    a?: string;
    c?: string;
    ivsa?: string;
    mpf?: string;
    fum?: string;
    fuc?: string;
    fup?: string;
    s?: string;
    u?: string;
    l?: string;
    bn?: string;
    cn?: string;
    ba?: string;
    o?: string;
    observaciones?: string;
}

export interface EstudioAnterior {
    id: number;
    diagnostico: string;
    orden: {
        id: number;
        consecutivo: string;
        numeroOrden: string;
        fechaIngreso: string;
        especimen?: { id: number; nombre: string };
        tipoEstudio?: { id: number; nombreTipoEstudio: string };
    };
}

export function nombrePaciente(p?: OrdenPendiente["paciente"]) {
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
