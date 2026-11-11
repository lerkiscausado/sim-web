"use client";

import { Campo } from "@/components/ui/campo";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { PacienteBusqueda } from "./types";
import { nombrePaciente, calcularEdad, estadoTexto } from "./types";
import { Select } from "@/components/ui/select";
import { hoyISO } from "@/lib/fechas";

export const HEADER_INICIAL = {
    idContrato: undefined as number | undefined,
    idSubentidad: undefined as number | undefined,
    idSede: undefined as number | undefined,
    idIngreso: undefined as number | undefined,
    idEmpleado: undefined as number | undefined,
    idTipoAfiliado: undefined as number | undefined,
    idTipoUsuario: undefined as number | undefined,
    idTipoEstudio: undefined as number | undefined,
    idEspecimen: undefined as number | undefined,
    idAmbito: undefined as number | undefined,
    idFinalidadConsulta: undefined as number | undefined,
    autorizacion: "",
    numeroOrden: "",
    fechaOrden: hoyISO(),
    comentarios: "",
};

/** Campos obligatorios del encabezado de la orden, con su etiqueta legible (para resaltar y para el mensaje de error detallado). */
export const CAMPOS_REQUERIDOS: { key: keyof typeof HEADER_INICIAL; label: string }[] = [
    { key: "idContrato", label: "Entidad o Contrato" },
    { key: "idSubentidad", label: "Subentidad" },
    { key: "idSede", label: "Sede" },
    { key: "idIngreso", label: "Tipo de Ingreso" },
    { key: "idEmpleado", label: "Médico" },
    { key: "idTipoAfiliado", label: "Tipo Afiliado" },
    { key: "idTipoUsuario", label: "Regimen, Tipo Usuario" },
    { key: "idTipoEstudio", label: "Tipo de Estudio" },
    { key: "idEspecimen", label: "Especimen" },
];

const ESTADO_ESTILOS: Record<string, { bg: string; text: string; dot: string }> = {
    PENDIENTE: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    PROCESO: { bg: "#DBEAFE", text: "#1E40AF", dot: "#2563EB" },
    ATENDIDO: { bg: "#D1FAE5", text: "#065F46", dot: "#059669" },
    CANCELADO: { bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
    FACTURADO: { bg: "#EDE9FE", text: "#5B21B6", dot: "#7C3AED" },
};

export function EstadoBadge({ estado }: { estado: string | string[] }) {
    const texto = estadoTexto(estado);
    const estilo = ESTADO_ESTILOS[texto] ?? { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" };
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: estilo.bg, color: estilo.text }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: estilo.dot }} />
            {texto}
        </span>
    );
}

/** Misma tarjeta que se usa en los resultados de búsqueda de paciente (foto + datos), reutilizada al ya tener el paciente seleccionado. */
export function PacienteCard({ p }: { p: PacienteBusqueda }) {
    return (
        <div
            className="flex items-stretch gap-3 rounded-lg border p-4"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
        >
            <PacienteAvatar idPaciente={p.id} />
            <div className="min-w-0 flex-1">
                <p className="font-bold" style={{ color: "var(--ink-primary)" }}>
                    {nombrePaciente(p).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {p.idTipoIdentificacion}
                    {p.identificacion}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Edad: {calcularEdad(p.fechaNacimiento)} años · Sexo: {p.sexo === "M" ? "Masculino" : "Femenino"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Teléfono: {p.telefono || "—"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">Correo: {p.correoElectronico || "—"}</p>
            </div>
        </div>
    );
}

export function Selector({
    label,
    value,
    onChange,
    options,
    disabled,
    nombre,
    error,
}: {
    label: string;
    value: number | string | undefined;
    onChange: (v: number) => void;
    options: { id: number | string; nombre: string }[];
    disabled?: boolean;
    nombre?: string;
    /** Mensaje de validación; si hay mensaje, el campo se resalta en rojo. */
    error?: string;
}) {
    const requerido = !!nombre && CAMPOS_REQUERIDOS.some((c) => c.key === nombre);
    return (
        <Campo label={label} nombre={nombre} error={error} requerido={requerido}>
            <Select
                className="w-full" selectClassName="disabled:opacity-50"
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                <option value="">Seleccionar…</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.nombre}
                    </option>
                ))}
            </Select>
        </Campo>
    );
}
