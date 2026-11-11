"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, FileDown, Loader2, Play, Plus, Save, Search, Table2, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { api, ApiError } from "@/lib/api";
import { abrirPdf } from "@/lib/descargas";
import { useAuth } from "@/lib/auth";
import { hoyISO } from "@/lib/fechas";
import { Select } from "@/components/ui/select";
import { usePaginacionLocal } from "@/lib/useTabla";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface Informe {
    id: number;
    nombre: string;
    query: string;
    estado: string;
}

interface ResultadoInforme {
    informe: { id: number; nombre: string };
    columnas: string[];
    filas: Record<string, unknown>[];
    truncado: boolean;
}

const hoy = hoyISO;

function aCsv(columnas: string[], filas: Record<string, unknown>[]) {
    const esc = (v: unknown) => {
        const t = v === null || v === undefined ? "" : String(v);
        return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    return "﻿" + [columnas.join(";"), ...filas.map((f) => columnas.map((c) => esc(f[c])).join(";"))].join("\r\n");
}

/**
 * Reportes de la licencia 16: Relación de Patologías por fecha
 * (bbiRelacionPatologias) e Informes guardados (frmInformes).
 */
export default function ReportesPage() {
    const { user } = useAuth();
    const [fecha, setFecha] = useState(hoy());
    const [generando, setGenerando] = useState(false);
    const [informes, setInformes] = useState<Informe[]>([]);
    const [idInforme, setIdInforme] = useState("");
    const [resultado, setResultado] = useState<ResultadoInforme | null>(null);
    const [ejecutando, setEjecutando] = useState(false);
    const [filtro, setFiltro] = useState("");
    const [error, setError] = useState<{ titulo: string; mensaje: string } | null>(null);
    const [editor, setEditor] = useState<{ id?: number; nombre: string; query: string; activo: boolean } | null>(null);
    const [guardando, setGuardando] = useState(false);

    async function cargarInformes() {
        try {
            setInformes(await api.get<Informe[]>("/admisiones/consulta/informes"));
        } catch {
            setInformes([]);
        }
    }
    useEffect(() => {
        cargarInformes();
    }, []);

    async function relacion() {
        setGenerando(true);
        try {
            await abrirPdf(`/admisiones/consulta/relacion-patologias/pdf?fecha=${fecha}`);
        } catch (e) {
            setError({ titulo: "Relación de patologías", mensaje: e instanceof ApiError ? e.message : "No se pudo generar" });
        } finally {
            setGenerando(false);
        }
    }

    async function ejecutar(id: string) {
        setIdInforme(id);
        setResultado(null);
        setFiltro("");
        if (!id) return;
        setEjecutando(true);
        try {
            setResultado(await api.post<ResultadoInforme>(`/admisiones/consulta/informes/${id}/ejecutar`));
        } catch (e) {
            setError({ titulo: "No se pudo ejecutar el informe", mensaje: e instanceof ApiError ? e.message : "Error" });
        } finally {
            setEjecutando(false);
        }
    }

    const filasVisibles = useMemo(() => {
        if (!resultado) return [];
        const q = filtro.trim().toLowerCase();
        if (!q) return resultado.filas;
        return resultado.filas.filter((f) => resultado.columnas.some((c) => String(f[c] ?? "").toLowerCase().includes(q)));
    }, [resultado, filtro]);
    const tablaInforme = usePaginacionLocal(filasVisibles, "informe-resultado", { defecto: 50 });

    function exportarCsv() {
        if (!resultado) return;
        const blob = new Blob([aCsv(resultado.columnas, filasVisibles)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${resultado.informe.nombre}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function guardarInforme() {
        if (!editor) return;
        setGuardando(true);
        try {
            const g = await api.post<Informe>("/admisiones/consulta/informes", {
                id: editor.id,
                nombre: editor.nombre,
                query: editor.query,
                estado: editor.activo ? "A" : "I",
            });
            setEditor(null);
            await cargarInformes();
            setIdInforme(String(g.id));
        } catch (e) {
            setError({ titulo: "No se pudo guardar el informe", mensaje: e instanceof ApiError ? e.message : "Error" });
        } finally {
            setGuardando(false);
        }
    }

    const informeSel = informes.find((i) => String(i.id) === idInforme);

    return (
        <div className="space-y-5">
            <div className="rounded-lg border px-6 py-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                    Admisiones
                </span>
                <h1 style={{ color: "var(--ink-primary)" }}>Informes y Reportes</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    Relación diaria de patologías e informes de consulta guardados.
                </p>
            </div>

            <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                    <BarChart2 size={16} /> Relación de Patologías
                </h2>
                <p className="mt-1 text-[12.5px] text-muted-foreground">Listado de los estudios ingresados en una fecha, para control de recepción de muestras.</p>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="space-y-1 text-[12px] font-medium">
                        <span className="block">Fecha de ingreso</span>
                        <Input type="date" className="w-auto" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    </label>
                    <Button onClick={relacion} disabled={generando || !fecha}>
                        {generando ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                        Ver relación
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                        <Table2 size={16} /> Informes
                    </h2>
                    {user?.admin && (
                        <div className="flex gap-2">
                            {informeSel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditor({ id: informeSel.id, nombre: informeSel.nombre, query: informeSel.query, activo: informeSel.estado === "A" })}
                                >
                                    Editar informe
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setEditor({ nombre: "", query: "SELECT ", activo: true })}>
                                <Plus size={14} /> Nuevo informe
                            </Button>
                        </div>
                    )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Select className="min-w-[280px]" value={idInforme} onChange={(e) => ejecutar(e.target.value)}>
                        <option value="">Seleccione un informe…</option>
                        {informes.map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.nombre}
                                {i.estado !== "A" ? " (inactivo)" : ""}
                            </option>
                        ))}
                    </Select>
                    {idInforme && (
                        <Button variant="outline" size="sm" onClick={() => ejecutar(idInforme)} disabled={ejecutando}>
                            {ejecutando ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
                            Ejecutar de nuevo
                        </Button>
                    )}
                    {resultado && (
                        <>
                            <div className="relative ml-auto w-64">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input className="pl-8" placeholder="Filtrar resultados…" value={filtro} onChange={(e) => setFiltro(e.target.value)} />
                            </div>
                            <Button variant="outline" size="sm" onClick={exportarCsv}>
                                <FileSpreadsheet size={14} /> Exportar CSV
                            </Button>
                        </>
                    )}
                </div>

                {ejecutando && (
                    <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Ejecutando…
                    </p>
                )}
                {resultado && !ejecutando && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {filasVisibles.length.toLocaleString()} filas{resultado.truncado ? " (se muestran las primeras 5.000)" : ""}
                        </p>
                        <div className="max-h-[60vh] overflow-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        {resultado.columnas.map((c) => (
                                            <TableHead key={c} className="whitespace-nowrap">
                                                {c}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tablaInforme.visibles.map((f, i) => (
                                        <TableRow key={i}>
                                            {resultado.columnas.map((c) => (
                                                <TableCell key={c} className="whitespace-nowrap py-1.5 text-xs">
                                                    {f[c] === null || f[c] === undefined ? "" : String(f[c])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <PaginationControls {...tablaInforme.paginacion} opcionesTamano={[10, 20, 30, 50, 100, 200]} />
                    </div>
                )}
            </div>

            {editor && (
                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                    <h2 className="text-[15px] font-semibold">{editor.id ? "Editar informe" : "Nuevo informe"}</h2>
                    <p className="mt-1 text-[12px] text-muted-foreground">Solo consultas SELECT (una sentencia). Se ejecutan en modo de solo lectura.</p>
                    <div className="mt-3 space-y-3">
                        <Input placeholder="Nombre del informe" value={editor.nombre} onChange={(e) => setEditor({ ...editor, nombre: e.target.value })} maxLength={150} />
                        <Textarea rows={8} className="font-mono text-xs" value={editor.query} onChange={(e) => setEditor({ ...editor, query: e.target.value })} />
                        <label className="flex items-center gap-2 text-[13px]">
                            <input type="checkbox" checked={editor.activo} onChange={(e) => setEditor({ ...editor, activo: e.target.checked })} /> Activo
                        </label>
                        <div className="flex gap-2">
                            <Button onClick={guardarInforme} disabled={guardando}>
                                {guardando ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Guardar
                            </Button>
                            <Button variant="outline" onClick={() => setEditor(null)}>
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ErrorDialog open={!!error} onOpenChange={(o) => !o && setError(null)} titulo={error?.titulo} mensaje={error?.mensaje} />
        </div>
    );
}
