"use client";

import { useEffect, useState } from "react";
import { Home, Trash2, Bell, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPreferencias, setPreferencias, PAGINAS_INICIO_DISPONIBLES, type Preferencias } from "@/lib/preferencias";

export default function PreferenciasPage() {
    const [prefs, setPrefsState] = useState<Preferencias | null>(null);
    const [guardado, setGuardado] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage no existe en el servidor, se lee tras montar en cliente
        setPrefsState(getPreferencias());
    }, []);

    function actualizar(cambios: Partial<Preferencias>) {
        setGuardado(false);
        setPrefsState((p) => (p ? { ...p, ...cambios } : p));
    }

    function guardar() {
        if (!prefs) return;
        setPreferencias(prefs);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
    }

    if (!prefs) return null;

    return (
        <div className="max-w-2xl space-y-5">
            <div
                className="rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                    Mi Cuenta
                </span>
                <h1 style={{ color: "var(--ink-primary)" }}>Preferencias</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    Ajustes de cómo se comporta el sistema para ti. Se guardan en este navegador.
                </p>
            </div>

            <div
                className="rounded-lg border p-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">Página de inicio</p>
                        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                            A dónde te lleva el sistema justo después de iniciar sesión.
                        </p>
                        <select
                            className="mt-2.5 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                            value={prefs.paginaInicio}
                            onChange={(e) => actualizar({ paginaInicio: e.target.value })}
                        >
                            {PAGINAS_INICIO_DISPONIBLES.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div
                className="rounded-lg border p-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">Confirmar antes de eliminar</p>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                                Muestra un cuadro de confirmación con el detalle antes de eliminar un registro.
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={prefs.confirmarEliminar}
                            onChange={(e) => actualizar({ confirmarEliminar: e.target.checked })}
                        />
                        <div className="peer h-5 w-9 rounded-full bg-muted/60 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4" />
                    </label>
                </div>
            </div>

            <div
                className="rounded-lg border p-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">Sonido de notificaciones</p>
                            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                                Reservado para cuando el sistema tenga notificaciones en tiempo real.
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={prefs.sonidoNotificaciones}
                            onChange={(e) => actualizar({ sonidoNotificaciones: e.target.checked })}
                        />
                        <div className="peer h-5 w-9 rounded-full bg-muted/60 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4" />
                    </label>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button onClick={guardar}>Guardar Preferencias</Button>
                {guardado && (
                    <span className="flex items-center gap-1.5 text-[12.5px] text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Guardado
                    </span>
                )}
            </div>

            <p
                className="flex items-start gap-2 rounded-md border px-4 py-3 text-[12.5px]"
                style={{ borderColor: "var(--border-default)", color: "var(--ink-secondary)" }}
            >
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Estas preferencias se guardan en este navegador (no en el servidor), así que son por
                equipo/navegador, no por usuario. Si necesitas que viajen contigo entre computadores, dínoslo
                y las movemos a la cuenta.
            </p>
        </div>
    );
}
