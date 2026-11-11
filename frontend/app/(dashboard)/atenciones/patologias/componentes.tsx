"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { api } from "@/lib/api";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { OrdenPendiente, Especimen } from "./types";
import { nombrePaciente, calcularEdad } from "./types";
import { Buscador } from "@/components/ui/buscador";

export function PacienteCard({ p }: { p: OrdenPendiente["paciente"] }) {
    if (!p) return null;
    return (
        <div className="flex items-stretch gap-3 rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
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

/** Buscador de espécimen (cboEspecimen): fija ordenes.ID_ESPECIMEN y patologia.TIPO_MUESTRA. */
export function EspecimenPicker({
    valor,
    onElegir,
    ...props
}: { valor: string; onElegir: (e: Especimen) => void } & Pick<ComponentProps<"input">, "id" | "aria-invalid" | "aria-describedby" | "aria-required">) {
    const [q, setQ] = useState(valor);
    const [abierto, setAbierto] = useState(false);
    const [resultados, setResultados] = useState<Especimen[]>([]);
    const [buscando, setBuscando] = useState(false);
    useEffect(() => setQ(valor), [valor]);
    useEffect(() => {
        if (!abierto) return;
        const t = setTimeout(async () => {
            setBuscando(true);
            try {
                const r = await api.get<{ data: Especimen[] }>(`/atenciones/especimenes?estado=A&pageSize=25&q=${encodeURIComponent(q.trim())}`);
                setResultados(r.data);
            } catch {
                setResultados([]);
            } finally {
                setBuscando(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [q, abierto]);
    return (
        <Buscador
            {...props}
            texto={q}
            placeholder="Buscar espécimen…"
            onTexto={(t) => {
                setQ(t);
                setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            cargando={buscando}
            resultados={resultados}
            claveDe={(e) => e.id}
            textoDe={(e) => e.nombre}
            onElegir={(e) => {
                onElegir(e);
                setQ(e.nombre);
            }}
            sinResultados="Ningún espécimen coincide."
            minCaracteres={1}
        />
    );
}
