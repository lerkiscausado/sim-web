"use client";

import { useEffect, useState } from "react";
import { Microscope, FileText, ClipboardList, PenLine, CheckCircle2, Clock, ArrowRight, Activity, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Resumen {
    empleado: string | null;
    patologiasPendientes: number;
    patologiasConInforme: number;
    citologiasPendientes: number;
    ordenesHoy: number;
    ordenesMes: number;
    firmadosMes: number;
    entregasHoy: number;
    actividad: { id: number; fecha: string; hora: string; estudio: string; idOrden: number; consecutivo: string; paciente: string; empleado: string | null }[];
}

const quickAccess = [
    { label: "Nueva Orden", href: "/admisiones/ordenes" },
    { label: "Consultar Órdenes", href: "/admisiones" },
    { label: "Patologías por atender", href: "/atenciones/patologias" },
    { label: "Citologías por atender", href: "/atenciones/citologias" },
    { label: "Relación de Patologías", href: "/admisiones/reportes" },
];

function hace(fecha: string, hora: string): string {
    const t = new Date(`${fecha}T${hora || "00:00:00"}`);
    const min = Math.round((Date.now() - t.getTime()) / 60000);
    if (Number.isNaN(min)) return "";
    if (min < 1) return "Ahora";
    if (min < 60) return `Hace ${min} min`;
    if (min < 60 * 24) return `Hace ${Math.round(min / 60)} h`;
    const d = Math.round(min / (60 * 24));
    return d === 1 ? "Ayer" : `Hace ${d} días`;
}

export default function InicioPage() {
    const [r, setR] = useState<Resumen | null>(null);
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

    useEffect(() => {
        api.get<Resumen>("/inicio/resumen").then(setR).catch(() => setR(null));
    }, []);

    const pct = (a: number, b: number) => `${b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0}%`;
    const stats = r
        ? [
              {
                  label: "Patologías por atender",
                  value: r.patologiasPendientes,
                  delta: `${r.patologiasConInforme} con informe sin firmar`,
                  icon: Microscope,
                  iconColor: "var(--clinical-500)",
                  iconBg: "var(--clinical-50)",
                  barColor: "var(--clinical-400)",
                  barWidth: pct(r.patologiasConInforme, r.patologiasPendientes),
                  href: "/atenciones/patologias",
              },
              {
                  label: "Citologías por atender",
                  value: r.citologiasPendientes,
                  delta: "Sin resultado",
                  icon: FileText,
                  iconColor: "var(--status-warning)",
                  iconBg: "var(--status-warning-bg)",
                  barColor: "var(--status-warning)",
                  barWidth: r.citologiasPendientes ? "100%" : "0%",
                  href: "/atenciones/citologias",
              },
              {
                  label: "Órdenes ingresadas hoy",
                  value: r.ordenesHoy,
                  delta: `${r.ordenesMes} en el mes`,
                  icon: ClipboardList,
                  iconColor: "var(--clinical-500)",
                  iconBg: "var(--clinical-50)",
                  barColor: "var(--clinical-400)",
                  barWidth: pct(r.ordenesHoy, r.ordenesMes),
                  href: "/admisiones",
              },
              {
                  label: "Estudios firmados en el mes",
                  value: r.firmadosMes,
                  delta: `${r.entregasHoy} entregas programadas hoy`,
                  icon: PenLine,
                  iconColor: "var(--status-success)",
                  iconBg: "var(--status-success-bg)",
                  barColor: "var(--status-success)",
                  barWidth: pct(r.firmadosMes, r.ordenesMes),
                  href: "/admisiones",
              },
          ]
        : [];

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-lg px-7 py-6" style={{ background: "var(--nav-ink-accent)", borderRadius: "var(--radius-lg)" }}>
                <div className="relative z-10">
                    <p className="label-clinical mb-2" style={{ color: "var(--clinical-300)" }}>
                        {now.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <h1 className="mb-1.5 text-[1.5rem] font-bold leading-tight" style={{ color: "#ffffff", letterSpacing: "-0.025em" }}>
                        {greeting}
                        {r?.empleado ? `, ${r.empleado}` : ""}
                    </h1>
                    <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                        {r ? (
                            <>
                                Hay <strong style={{ color: "#fff" }}>{r.patologiasPendientes} patologías</strong> y{" "}
                                <strong style={{ color: "#fff" }}>{r.citologiasPendientes} citologías</strong> pendientes de informe.
                            </>
                        ) : (
                            "Cargando resumen…"
                        )}
                    </p>
                </div>
                <div
                    className="absolute bottom-0 right-0 top-0 w-48 opacity-10"
                    style={{ background: "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px)" }}
                />
            </div>

            {!r && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando indicadores…
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.label}
                            href={stat.href}
                            className="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm"
                            style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                        >
                            <div className="px-5 pb-3 pt-4">
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex h-8 w-8 items-center justify-center" style={{ background: stat.iconBg, borderRadius: "var(--radius-sm)" }}>
                                        <Icon size={16} color={stat.iconColor} strokeWidth={1.75} />
                                    </div>
                                    <span className="text-right text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
                                        {stat.delta}
                                    </span>
                                </div>
                                <div className="data-value mb-0.5" style={{ color: "var(--ink-primary)" }}>
                                    {stat.value.toLocaleString()}
                                </div>
                                <p className="text-[12px] font-medium" style={{ color: "var(--ink-secondary)" }}>
                                    {stat.label}
                                </p>
                            </div>
                            <div className="h-1" style={{ background: "var(--surface-inset)" }}>
                                <div className="h-full" style={{ width: stat.barWidth, background: stat.barColor, opacity: 0.7 }} />
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="overflow-hidden rounded-lg border xl:col-span-2" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                    <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--border-subtle)" }}>
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: "var(--accent)" }} />
                            <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                                Últimos estudios firmados
                            </h2>
                        </div>
                    </div>
                    <div>
                        {r && r.actividad.length === 0 && (
                            <p className="px-5 py-6 text-center text-[12.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                Aún no hay estudios firmados.
                            </p>
                        )}
                        {r?.actividad.map((a) => (
                            <div key={a.id} className="flex items-center gap-3.5 border-b px-5 py-3 last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                                <CheckCircle2 size={14} color="var(--status-success)" className="shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12.5px] font-medium" style={{ color: "var(--ink-primary)" }}>
                                        {a.paciente || "—"} · {a.consecutivo}
                                    </p>
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                                        {a.estudio}
                                        {a.empleado ? ` · ${a.empleado}` : ""}
                                    </p>
                                </div>
                                <span className="shrink-0 text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                    {hace(a.fecha, a.hora)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-hidden rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                    <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "var(--border-subtle)" }}>
                        <Activity size={14} style={{ color: "var(--accent)" }} />
                        <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                            Acceso Rápido
                        </h2>
                    </div>
                    <div className="space-y-1.5 p-3">
                        {quickAccess.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group flex items-center justify-between rounded px-3.5 py-2.5 text-[12.5px] font-medium transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-base)]"
                                style={{ color: "var(--ink-primary)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}
                            >
                                {item.label}
                                <ArrowRight size={12} style={{ color: "var(--ink-tertiary)" }} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
