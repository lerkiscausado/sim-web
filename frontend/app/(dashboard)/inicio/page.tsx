"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, ClipboardPlus, Loader2, PenLine } from "lucide-react";
import { api } from "@/lib/api";
import { nombrePropio } from "@/lib/utils";
import { useResumen } from "@/lib/resumen";
import { diasHabilesDesde, PLAZO_DIAS_HABILES } from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { Etiqueta, Indicador, Panel, PanelHeader, Pildora } from "@/components/ui/panel";
import type { OrdenPendiente } from "../atenciones/patologias/types";
import { nombrePaciente } from "../atenciones/patologias/types";

function hace(fecha: string, hora: string): string {
    const t = new Date(`${fecha}T${hora || "00:00:00"}`);
    const min = Math.round((Date.now() - t.getTime()) / 60000);
    if (Number.isNaN(min)) return "";
    if (min < 1) return "Ahora";
    if (min < 60) return `${min} min`;
    if (min < 60 * 24) return `${Math.round(min / 60)} h`;
    const d = Math.round(min / (60 * 24));
    return d === 1 ? "Ayer" : `${d} días`;
}

const pct = (a: number, b: number) => (b > 0 ? a / b : 0);

export default function InicioPage() {
    const { resumen: r } = useResumen();
    const [pendientes, setPendientes] = useState<OrdenPendiente[] | null>(null);
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

    useEffect(() => {
        api.get<OrdenPendiente[]>("/atenciones/patologia/pendientes")
            .then(setPendientes)
            .catch(() => setPendientes([]));
    }, []);

    /** Cola de firma: los más antiguos primero. */
    const cola = useMemo(
        () =>
            (pendientes ?? [])
                .map((o) => ({ ...o, dias: diasHabilesDesde(o.fechaIngreso) }))
                .sort((a, b) => b.dias - a.dias || a.fechaIngreso.localeCompare(b.fechaIngreso)),
        [pendientes],
    );
    const vencidos = cola.filter((o) => o.dias > PLAZO_DIAS_HABILES).length;

    /** Pendientes de patología por sede, separando los que ya tienen informe sin firmar. */
    const porSede = useMemo(() => {
        const m = new Map<string, { sede: string; conInforme: number; sinInforme: number }>();
        for (const o of pendientes ?? []) {
            const sede = o.sede?.nombre ?? "Sin sede";
            const fila = m.get(sede) ?? { sede, conInforme: 0, sinInforme: 0 };
            if (o.tieneInforme) fila.conInforme++;
            else fila.sinInforme++;
            m.set(sede, fila);
        }
        return [...m.values()].sort((a, b) => b.conInforme + b.sinInforme - (a.conInforme + a.sinInforme));
    }, [pendientes]);
    const maxSede = Math.max(1, ...porSede.map((s) => s.conInforme + s.sinInforme));

    return (
        <div className="space-y-5">
            <div className="encabezado-modulo flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="label-clinical first-letter:uppercase" style={{ color: "var(--ink-brand)" }}>
                        {now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <h1 style={{ color: "var(--ink-primary)" }}>
                        {greeting}
                        {r?.empleado ? `, ${nombrePropio(r.empleado)}` : ""}
                    </h1>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        {r ? (
                            <>
                                Hay <strong style={{ color: "var(--ink-primary)" }}>{r.patologiasPendientes} patologías</strong> y{" "}
                                <strong style={{ color: "var(--ink-primary)" }}>{r.citologiasPendientes} citologías</strong> pendientes de informe
                                {vencidos > 0 && (
                                    <>
                                        ;{" "}
                                        <strong style={{ color: "var(--clinical-600)" }}>
                                            {vencidos} {vencidos === 1 ? "supera" : "superan"} los {PLAZO_DIAS_HABILES} días hábiles
                                        </strong>
                                    </>
                                )}
                                .
                            </>
                        ) : (
                            "Cargando resumen…"
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admisiones/ordenes">
                            <ClipboardPlus size={14} /> Nueva orden
                        </Link>
                    </Button>
                    <Button size="sm" asChild>
                        <Link href={cola[0] ? `/atenciones/patologias?orden=${cola[0].id}` : "/atenciones/patologias"}>
                            <PenLine size={14} /> Continuar informando
                        </Link>
                    </Button>
                </div>
            </div>

            {!r ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando indicadores…
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    <Indicador
                        titulo="Patologías por firmar"
                        valor={r.patologiasPendientes.toLocaleString()}
                        marca={vencidos > 0 ? <Pildora tono="marca">{vencidos} {vencidos === 1 ? "vencida" : "vencidas"}</Pildora> : undefined}
                        detalle={`${r.patologiasConInforme} con informe, falta la firma`}
                        proporcion={pct(r.patologiasConInforme, r.patologiasPendientes)}
                        color="var(--clinical-500)"
                        href="/atenciones/patologias"
                    />
                    <Indicador
                        titulo="Citologías por atender"
                        valor={r.citologiasPendientes.toLocaleString()}
                        detalle="Sin resultado"
                        proporcion={r.citologiasPendientes ? 1 : 0}
                        color="var(--status-warning)"
                        href="/atenciones/citologias"
                    />
                    <Indicador
                        titulo="Órdenes ingresadas hoy"
                        valor={r.ordenesHoy.toLocaleString()}
                        detalle={`${r.ordenesMes.toLocaleString()} en el mes`}
                        proporcion={pct(r.ordenesHoy, r.ordenesMes)}
                        color="var(--status-info)"
                        href="/admisiones/ordenes"
                    />
                    <Indicador
                        titulo="Estudios firmados en el mes"
                        valor={r.firmadosMes.toLocaleString()}
                        detalle={`${r.entregasHoy} entregas programadas hoy`}
                        proporcion={pct(r.firmadosMes, r.ordenesMes)}
                        color="var(--status-success)"
                        href="/admisiones"
                    />
                </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
                <Panel>
                    <PanelHeader titulo="Cola de patologías por firmar" etiqueta={<Etiqueta>Más antiguas primero</Etiqueta>}>
                        <Link href="/atenciones/patologias" className="font-medium hover:underline" style={{ color: "var(--ink-brand)" }}>
                            Ver todas →
                        </Link>
                    </PanelHeader>
                    {pendientes === null && (
                        <p className="flex items-center justify-center gap-2 px-4 py-8 text-[12.5px] text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                        </p>
                    )}
                    {pendientes && cola.length === 0 && (
                        <p className="px-4 py-8 text-center text-[12.5px]" style={{ color: "var(--ink-tertiary)" }}>
                            No hay patologías pendientes. ¡Todo al día!
                        </p>
                    )}
                    <ul>
                        {cola.slice(0, 7).map((o) => {
                            const vencido = o.dias > PLAZO_DIAS_HABILES;
                            return (
                                <li key={o.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                                    <Link
                                        href={`/atenciones/patologias?orden=${o.id}`}
                                        className="grid grid-cols-[96px_1fr_auto] items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-inset)] sm:grid-cols-[96px_1fr_120px_84px_16px]"
                                    >
                                        <span className="dato-mono text-[12.5px] font-semibold">{o.consecutivo || o.id}</span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium" style={{ color: "var(--ink-primary)" }}>
                                                {nombrePaciente(o.paciente)}
                                            </span>
                                            <span className="block truncate text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                {[o.tipoEstudio?.nombreTipoEstudio, o.especimen?.nombre].filter(Boolean).join(" · ")}
                                                {o.tieneInforme ? " · con informe" : ""}
                                            </span>
                                        </span>
                                        <span className="hidden sm:block">{o.sede && <Etiqueta>{o.sede.nombre}</Etiqueta>}</span>
                                        <span
                                            className="dato-mono text-right text-[11.5px]"
                                            style={{ color: vencido ? "var(--clinical-600)" : "var(--ink-secondary)", fontWeight: vencido ? 600 : 400 }}
                                            title="Días hábiles desde el ingreso"
                                        >
                                            {o.dias} {o.dias === 1 ? "día" : "días"}
                                        </span>
                                        <ChevronRight size={14} className="hidden sm:block" style={{ color: "var(--ink-muted)" }} />
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </Panel>

                <div className="flex flex-col gap-4">
                    <Panel>
                        <PanelHeader titulo="Patologías pendientes por sede" />
                        {porSede.length === 0 ? (
                            <p className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                Sin pendientes.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3.5 px-4 py-3.5">
                                {porSede.map((s) => {
                                    const total = s.conInforme + s.sinInforme;
                                    return (
                                        <div key={s.sede}>
                                            <div className="mb-1.5 flex justify-between text-[12.5px]">
                                                <span>{s.sede}</span>
                                                <span className="dato-mono" style={{ color: "var(--ink-secondary)" }}>
                                                    {total}
                                                </span>
                                            </div>
                                            <div
                                                className="flex h-2 overflow-hidden rounded"
                                                style={{ background: "var(--border-subtle)" }}
                                                role="img"
                                                aria-label={`${s.sede}: ${s.sinInforme} sin informe, ${s.conInforme} con informe sin firmar`}
                                            >
                                                <span style={{ width: `${(s.sinInforme / maxSede) * 100}%`, background: "var(--clinical-500)" }} />
                                                <span style={{ width: `${(s.conInforme / maxSede) * 100}%`, background: "var(--status-warning)" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="flex gap-4 px-4 pb-3.5 text-[11.5px]" style={{ color: "var(--ink-secondary)" }}>
                            <span className="flex items-center gap-1.5">
                                <i className="h-2 w-2 rounded-sm" style={{ background: "var(--clinical-500)" }} /> Sin informe
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="h-2 w-2 rounded-sm" style={{ background: "var(--status-warning)" }} /> Con informe, sin firma
                            </span>
                        </div>
                    </Panel>

                    <Panel>
                        <PanelHeader titulo="Últimos estudios firmados" />
                        {r && r.actividad.length === 0 && (
                            <p className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                Aún no hay estudios firmados.
                            </p>
                        )}
                        <ul className="py-1">
                            {r?.actividad.slice(0, 6).map((a) => (
                                <li key={a.id} className="flex items-start gap-2.5 px-4 py-2">
                                    <span
                                        className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                                        style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}
                                    >
                                        <CheckCircle2 size={12} />
                                    </span>
                                    <span className="min-w-0 flex-1 text-[12.5px] leading-snug">
                                        <span className="dato-mono font-semibold">{a.consecutivo}</span>{" "}
                                        <span style={{ color: "var(--ink-secondary)" }}>· {a.paciente || "—"}</span>
                                        <span className="block truncate text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                            {a.estudio}
                                            {a.empleado ? ` · ${a.empleado}` : ""}
                                        </span>
                                    </span>
                                    <span className="shrink-0 text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                        {hace(a.fecha, a.hora)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            </div>
        </div>
    );
}
