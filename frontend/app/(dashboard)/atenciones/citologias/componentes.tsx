"use client";

import { AlertCircle } from "lucide-react";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import type { OrdenPendiente } from "./types";
import { nombrePaciente, calcularEdad } from "./types";
import type { ChecksState } from "./constantes";

/** Misma tarjeta de paciente (foto + datos) usada en Pacientes, Órdenes y Patologías. */
export function PacienteCard({ p }: { p: OrdenPendiente["paciente"] }) {
    if (!p) return null;
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

export function GrupoChecks({
    titulo,
    items,
    checks,
    onToggle,
    nombre,
    error,
}: {
    titulo: string;
    items: { key: string; label: string }[];
    checks: ChecksState;
    onToggle: (key: string, value: boolean) => void;
    /** Nombre del grupo para la validación (lleva el foco al primer grupo con error). */
    nombre?: string;
    error?: string;
}) {
    return (
        <div
            data-campo={nombre}
            className={`rounded-lg border p-4 ${error ? "campo-invalido" : ""}`}
            style={{ background: "var(--surface-raised)", borderColor: error ? "var(--destructive)" : "var(--border-default)" }}
        >
            <p className="mb-3 text-[12.5px] font-bold" style={{ color: error ? "var(--destructive)" : "var(--ink-primary)" }}>
                {titulo}
                {error && <span className="ml-0.5">*</span>}
            </p>
            {error && (
                <p role="alert" className="-mt-2 mb-3 flex items-center gap-1 text-[11.5px] text-red-600">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {error}
                </p>
            )}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {items.map((item) => (
                    <label key={item.key} className="flex items-start gap-2 text-[12.5px]">
                        <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={!!checks[item.key]}
                            onChange={(e) => onToggle(item.key, e.target.checked)}
                        />
                        <span>{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}
