"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Activity, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, PenLine } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlPreviewDialog } from "@/components/ui/html-preview-dialog";
import { Badge } from "@/components/ui/badge";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { OrdenPendiente, EndoscopiaData, EstudioAnterior, PacienteEndoscopia } from "./types";
import { nombrePaciente, calcularEdad, plantillaPorEstudio } from "./types";

function FORM_INICIAL(): EndoscopiaData {
    return {
        idOrden: 0,
        idDetalleOrden: 0,
        fechaEstudio: new Date().toISOString().slice(0, 10),
        fechaSalida: new Date().toISOString().slice(0, 10),
        medicoSolicita: "",
        indicacion: "",
        medicamentos: "",
        idEquipo: undefined,
        idProcedimientoTerapeutico: undefined,
        anestesiologo: "",
        campo1: "",
        campo6: "",
        diagnostico: "",
        codigoDiagnostico: "",
    };
}

function PacienteCard({ p }: { p?: PacienteEndoscopia }) {
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

type Vista = "listado" | "informe";

export default function EndoscopiasPage() {
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState<EndoscopiaData>(FORM_INICIAL());
    const [guardando, setGuardando] = useState(false);
    const [firmando, setFirmando] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardadoOk, setGuardadoOk] = useState(false);
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
    const [procedimientos, setProcedimientos] = useState<{ id: number; nombre: string }[]>([]);
    const [cie10Query, setCie10Query] = useState("");
    const [cie10Resultados, setCie10Resultados] = useState<{ codigoDiagnostico: string; nombreDiagnostico: string | null }[]>([]);
    const [cie10Nombre, setCie10Nombre] = useState("");

    const cargarPendientes = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const pend = await api.get<OrdenPendiente[]>(`/atenciones/endoscopias/pendientes${qs}`);
            setPendientes(pend);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            cargarPendientes(searchTerm);
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    useEffect(() => {
        if (cie10Query.trim().length < 2) return setCie10Resultados([]);
        const t = setTimeout(async () => {
            try {
                setCie10Resultados(await api.get(`/catalogos/diagnosticos/search?q=${encodeURIComponent(cie10Query)}`));
            } catch {
                setCie10Resultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [cie10Query]);

    async function abrirOrden(orden: OrdenPendiente) {
        setOrdenActiva(orden);
        setFormError(null);
        setGuardadoOk(false);
        setCie10Query("");
        setCie10Nombre("");
        setVista("informe");

        api.get<{ id: number; nombre: string }[]>("/catalogos/lookup/equipos").then(setEquipos).catch(() => setEquipos([]));
        api
            .get<{ id: number; nombre: string }[]>("/catalogos/lookup/procedimientos-terapeuticos")
            .then(setProcedimientos)
            .catch(() => setProcedimientos([]));

        api
            .get<EstudioAnterior[]>(`/atenciones/endoscopias/paciente/${orden.idUsuario}/estudios-anteriores`)
            .then(setEstudiosAnteriores)
            .catch(() => setEstudiosAnteriores([]));

        try {
            const existente = await api.get<EndoscopiaData | null>(`/atenciones/endoscopias/detalle-orden/${orden.idDetalleOrden}`);
            if (existente) {
                setForm({ ...existente, idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden });
                if (existente.codigoDiagnostico) setCie10Query(existente.codigoDiagnostico);
            } else {
                const plantilla = plantillaPorEstudio(orden.estudio).replace(/\n/g, "<br>");
                setForm({ ...FORM_INICIAL(), idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden, campo1: plantilla, campo6: orden.nombreCups });
            }
        } catch {
            const plantilla = plantillaPorEstudio(orden.estudio).replace(/\n/g, "<br>");
            setForm({ ...FORM_INICIAL(), idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden, campo1: plantilla, campo6: orden.nombreCups });
        }
    }

    function volverAlListado() {
        setVista("listado");
        setOrdenActiva(null);
        cargarPendientes(searchTerm);
    }

    function elegirCie10(d: { codigoDiagnostico: string; nombreDiagnostico: string | null }) {
        setForm((f) => ({ ...f, codigoDiagnostico: d.codigoDiagnostico }));
        setCie10Nombre(d.nombreDiagnostico ?? "");
        setCie10Query(d.codigoDiagnostico);
        setCie10Resultados([]);
    }

    async function guardarInforme() {
        if (!ordenActiva) return;
        setFormError(null);
        setGuardadoOk(false);

        if (!form.medicoSolicita || !form.indicacion || !form.idEquipo || !form.idProcedimientoTerapeutico || !form.campo1 || !form.diagnostico) {
            setFormError("Médico que solicita, indicación, equipo, procedimiento terapéutico, reporte y diagnóstico son obligatorios.");
            return;
        }

        setGuardando(true);
        try {
            await api.post("/atenciones/endoscopias", form);
            setGuardadoOk(true);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el reporte");
        } finally {
            setGuardando(false);
        }
    }

    async function firmarReporte() {
        if (!ordenActiva) return;
        setFirmando(true);
        setFormError(null);
        try {
            await api.patch(`/atenciones/endoscopias/detalle-orden/${ordenActiva.idDetalleOrden}/firmar`);
            volverAlListado();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo firmar el reporte");
        } finally {
            setFirmando(false);
        }
    }

    if (vista === "informe" && ordenActiva) {
        return (
            <div className="space-y-5">
                <div
                    className="flex items-center justify-between rounded-lg border px-6 py-5"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                >
                    <div>
                        <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                            Atenciones · Endoscopias
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>Informe de {ordenActiva.estudio} — Orden {ordenActiva.consecutivo || ordenActiva.idOrden}</h1>
                        <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                            {ordenActiva.nombreCups} · Fecha de ingreso: {ordenActiva.fechaIngreso}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={volverAlListado}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Listado
                    </Button>
                </div>

                <div className="grid grid-cols-10 gap-4">
                    {/* Columna izquierda: 30% */}
                    <div className="col-span-10 space-y-4 lg:col-span-3">
                        <PacienteCard p={ordenActiva.paciente} />

                        <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="border-b px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "var(--border-default)" }}>
                                Estudios Anteriores
                            </p>
                            {estudiosAnteriores.length === 0 ? (
                                <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                                    Este paciente no tiene endoscopias anteriores registradas.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Estudio</span></TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estudiosAnteriores.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="py-2.5">
                                                    <p className="text-sm font-bold">{e.consecutivo || e.idOrden}</p>
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {e.fechaIngreso}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs">{e.estudio ?? "—"}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" title="Vista previa" onClick={() => setPreviewAnterior(e)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* Columna derecha: 70% */}
                    <div className="col-span-10 space-y-4 lg:col-span-7">
                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-bold">Datos del Procedimiento</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Fecha de Estudio</label>
                                    <Input type="date" value={form.fechaEstudio} onChange={(e) => setForm((f) => ({ ...f, fechaEstudio: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Fecha de Salida</label>
                                    <Input type="date" value={form.fechaSalida ?? ""} onChange={(e) => setForm((f) => ({ ...f, fechaSalida: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Médico que Solicita</label>
                                    <Input value={form.medicoSolicita} onChange={(e) => setForm((f) => ({ ...f, medicoSolicita: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Anestesiólogo</label>
                                    <Input value={form.anestesiologo ?? ""} onChange={(e) => setForm((f) => ({ ...f, anestesiologo: e.target.value }))} />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Indicación</label>
                                    <Input value={form.indicacion} onChange={(e) => setForm((f) => ({ ...f, indicacion: e.target.value }))} />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Medicamentos</label>
                                    <Input value={form.medicamentos ?? ""} onChange={(e) => setForm((f) => ({ ...f, medicamentos: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Equipo</label>
                                    <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={form.idEquipo ?? ""} onChange={(e) => setForm((f) => ({ ...f, idEquipo: Number(e.target.value) || undefined }))}>
                                        <option value="">Seleccionar…</option>
                                        {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Procedimiento Terapéutico</label>
                                    <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={form.idProcedimientoTerapeutico ?? ""} onChange={(e) => setForm((f) => ({ ...f, idProcedimientoTerapeutico: Number(e.target.value) || undefined }))}>
                                        <option value="">Seleccionar…</option>
                                        {procedimientos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-bold">Reporte del Procedimiento</p>
                                {form.campo1 && (
                                    <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                        Vista previa
                                    </Button>
                                )}
                            </div>
                            <RichTextEditor rows={8} value={form.campo1} onChange={(html) => setForm((f) => ({ ...f, campo1: html }))} />
                        </div>

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-bold">Diagnóstico</p>
                            <RichTextEditor rows={4} value={form.diagnostico} onChange={(html) => setForm((f) => ({ ...f, diagnostico: html }))} />

                            <div className="relative mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Código CIE10</label>
                                <Input placeholder="Buscar por código o nombre…" value={cie10Query} onChange={(e) => setCie10Query(e.target.value)} />
                                {cie10Nombre && (
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>{form.codigoDiagnostico} — {cie10Nombre}</p>
                                )}
                                {cie10Resultados.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md" style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}>
                                        {cie10Resultados.map((d) => (
                                            <button key={d.codigoDiagnostico} type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5" onClick={() => elegirCie10(d)}>
                                                <span className="font-semibold">{d.codigoDiagnostico}</span> — {d.nombreDiagnostico}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {formError && (
                                <p className="mt-3 rounded-md px-3 py-2 text-[12.5px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>
                                    {formError}
                                </p>
                            )}
                            {guardadoOk && (
                                <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-[12.5px] text-green-700">Reporte guardado correctamente.</p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                <Button onClick={guardarInforme} disabled={guardando}>
                                    {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Reporte
                                </Button>
                                <Button variant="outline" onClick={firmarReporte} disabled={firmando}>
                                    {firmando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                                    Firmar y Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <HtmlPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    titulo={`Orden ${ordenActiva.consecutivo || ordenActiva.idOrden}`}
                    maxWidthClassName="max-w-4xl"
                    secciones={[
                        { titulo: "Reporte del Procedimiento", html: form.campo1 },
                        { titulo: "Diagnóstico", html: form.diagnostico, destacado: true },
                    ]}
                />

                <HtmlPreviewDialog
                    open={!!previewAnterior}
                    onOpenChange={(open) => !open && setPreviewAnterior(null)}
                    titulo={`Orden ${previewAnterior?.consecutivo ?? ""}`}
                    maxWidthClassName="max-w-4xl"
                    secciones={[
                        { titulo: "Reporte del Procedimiento", html: previewAnterior?.campo1 ?? "" },
                        { titulo: "Diagnóstico", html: previewAnterior?.diagnostico ?? "", destacado: true },
                    ]}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Endoscopias</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Tus pacientes pendientes de reporte de endoscopia
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => cargarPendientes(searchTerm)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && (
                <p className="rounded-md px-4 py-2.5 text-[13px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>
                    {error}
                </p>
            )}

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por orden, nombre o identificación..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Paciente</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Estudio</span></TableHead>
                            <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-8 text-center text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    No tienes pacientes pendientes de endoscopia.
                                </TableCell>
                            </TableRow>
                        )}
                        {pendientes.map((orden) => (
                            <TableRow key={orden.idDetalleOrden} className="align-top hover:bg-muted/40">
                                <TableCell className="py-3">
                                    <p className="font-bold">{orden.consecutivo || orden.idOrden}</p>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <CalendarDays className="h-3 w-3" />
                                        {orden.fechaIngreso}
                                    </p>
                                </TableCell>
                                <TableCell className="py-3">
                                    <p className="font-bold">{nombrePaciente(orden.paciente).toUpperCase()}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {orden.paciente.idTipoIdentificacion}
                                        {orden.paciente.identificacion} · {orden.paciente.sexo === "M" ? "M" : "F"} ·{" "}
                                        {calcularEdad(orden.paciente.fechaNacimiento)} años
                                        {orden.paciente.telefono ? ` · ${orden.paciente.telefono}` : ""}
                                    </p>
                                </TableCell>
                                <TableCell className="py-3 text-sm">
                                    <Badge variant="secondary">{orden.estudio}</Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">{orden.nombreCups}</p>
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                    <Button size="sm" onClick={() => abrirOrden(orden)}>
                                        <Activity size={14} />
                                        Informar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
