"use client";

import { useEffect, useState } from "react";
import { Activity, Twitter, Instagram, Phone, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface LicenciaActiva {
    cliente: string;
    serial: string;
    idOrigen: string;
}

export default function AcercaDePage() {
    const [licencia, setLicencia] = useState<LicenciaActiva | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get<LicenciaActiva | null>("/seguridad/licencias/activa")
            .then(setLicencia)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mx-auto max-w-2xl space-y-5">
            <div
                className="rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                    Ayuda
                </span>
                <h1 style={{ color: "var(--ink-primary)" }}>Acerca de SIM</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    Información sobre la versión, el proveedor y la licencia del sistema
                </p>
            </div>

            <div className="rounded-lg border p-6" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span
                                className="flex h-9 w-9 items-center justify-center rounded-md"
                                style={{ background: "var(--clinical-500, #2563eb)" }}
                            >
                                <Activity size={18} color="#fff" strokeWidth={2.5} />
                            </span>
                            <div>
                                <p className="text-lg font-bold" style={{ color: "var(--ink-primary)" }}>
                                    SIM
                                </p>
                                <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
                                    Sistema Integrado Médico
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm" style={{ color: "var(--ink-secondary)" }}>
                            Software Administrativo para Especialistas de la Salud
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
                            Síguenos:
                        </p>
                        <div className="mt-1.5 flex flex-col items-end gap-1 text-xs" style={{ color: "var(--ink-secondary)" }}>
                            <span className="flex items-center gap-1.5">
                                <Twitter size={13} />
                                /adossoftware
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Instagram size={13} />
                                @adossoftware
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Phone size={13} />
                                317 503 5033 · 310 404 8554
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 border-t pt-4 text-center" style={{ borderColor: "var(--border-default)" }}>
                    <p className="text-sm font-medium" style={{ color: "var(--ink-primary)" }}>
                        Versión Web — basada en SIM 5.1.0.1
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--ink-secondary)" }}>
                        Copyright © {new Date().getFullYear()} — Todos los Derechos Reservados
                    </p>
                </div>

                <div
                    className="mt-5 space-y-1.5 rounded-md border px-4 py-3 text-[13px]"
                    style={{ borderColor: "var(--border-default)", background: "var(--surface-sunken, #f9fafb)" }}
                >
                    {loading ? (
                        <p className="flex items-center gap-2" style={{ color: "var(--ink-secondary)" }}>
                            <Loader2 size={13} className="animate-spin" />
                            Cargando datos de licencia…
                        </p>
                    ) : licencia ? (
                        <>
                            <p>
                                <span className="font-medium">Este Programa esta Registrado a Nombre de:</span> {licencia.cliente}
                            </p>
                            <p>
                                <span className="font-medium">Numero de Serie:</span> {licencia.serial}
                            </p>
                            <p>
                                <span className="font-medium">ID de Origen:</span> {licencia.idOrigen}
                            </p>
                        </>
                    ) : (
                        <p style={{ color: "var(--ink-secondary)" }}>No hay una licencia activa registrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
