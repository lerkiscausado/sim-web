"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown, Loader2, Microscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search } from "lucide-react";
import { api, apiFetchBlobUrl, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type {
    OrdenPendiente,
    Especimen,
    PlantillaPatologia,
    DiagnosticoCie10,
    InformePatologia,
    UpsertPatologiaPayload,
    EstudioAnterior,
} from "./types";
import { nombrePaciente, calcularEdad } from "./types";

const FORM_INICIAL = {
    tipoMuestra: "",
    sitioLesion: "",
    solicitado: "",
    descripcionMacroscopica: "",
    descripcionMicroscopica: "",
    diagnostico: "",
    observaciones: "",
    codigoDiagnostico: "",
    idEspecimen: undefined as number | undefined,
    fechaSalida: new Date().toISOString().slice(0, 10),
};

/** Misma tarjeta de paciente (foto + datos) usada en Pacientes y Órdenes. */
function PacienteCard({ p }: { p: OrdenPendiente["paciente"] }) {
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

export default function PatologiasPage() {
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [especimenes, setEspecimenes] = useState<Especimen[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaPatologia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [cie10Query, setCie10Query] = useState("");
    const [cie10Resultados, setCie10Resultados] = useState<DiagnosticoCie10[]>([]);
    const [cie10Nombre, setCie10Nombre] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [informeGuardado, setInformeGuardado] = useState<InformePatologia | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [plantillaQuery, setPlantillaQuery] = useState("");
    const [plantillaResultadosAbiertos, setPlantillaResultadosAbiertos] = useState(false);
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);

    const cargarPendientes = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const [pend, esp, plant] = await Promise.all([
                api.get<OrdenPendiente[]>(`/atenciones/patologia/pendientes${qs}`),
                api.get<Especimen[]>("/atenciones/especimenes/activos"),
                api.get<PlantillaPatologia[]>("/atenciones/plantillas-patologia"),
            ]);
            setPendientes(pend);
            setEspecimenes(esp);
            setPlantillas(plant);
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

    // Búsqueda CIE10 con debounce simple
    useEffect(() => {
        if (cie10Query.trim().length < 2) {
            setCie10Resultados([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await api.get<DiagnosticoCie10[]>(
                    `/catalogos/diagnosticos/search?q=${encodeURIComponent(cie10Query)}`
                );
                setCie10Resultados(res);
            } catch {
                setCie10Resultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [cie10Query]);

    async function abrirOrden(orden: OrdenPendiente) {
        setOrdenActiva(orden);
        setFormError(null);
        setInformeGuardado(null);
        setForm({ ...FORM_INICIAL, idEspecimen: orden.idEspecimen });
        setCie10Query("");
        setCie10Nombre("");
        setPlantillaQuery("");
        setPlantillaResultadosAbiertos(false);
        setEstudiosAnteriores([]);
        setVista("informe");

        api
            .get<EstudioAnterior[]>(`/atenciones/patologia/paciente/${orden.idUsuario}/estudios-anteriores`)
            .then(setEstudiosAnteriores)
            .catch(() => setEstudiosAnteriores([]));

        try {
            const existente = await api.get<InformePatologia | null>(
                `/atenciones/patologia/orden/${orden.id}`
            );
            if (existente) {
                setForm({
                    tipoMuestra: existente.tipoMuestra,
                    sitioLesion: existente.sitioLesion,
                    solicitado: existente.solicitado,
                    descripcionMacroscopica: existente.descripcionMacroscopica,
                    descripcionMicroscopica: existente.descripcionMicroscopica,
                    diagnostico: existente.diagnostico,
                    observaciones: existente.observaciones ?? "",
                    codigoDiagnostico: existente.codigoDiagnostico,
                    idEspecimen: orden.idEspecimen,
                    fechaSalida: existente.fechaSalida,
                });
                setCie10Query(existente.codigoDiagnostico);
                setInformeGuardado(existente);
            }
        } catch {
            // no hay informe previo todavía, se deja el formulario en blanco
        }
    }

    function volverAlListado() {
        setVista("listado");
        setOrdenActiva(null);
        cargarPendientes(searchTerm);
    }

    function aplicarPlantilla(id: string) {
        const plantilla = plantillas.find((p) => String(p.id) === id);
        if (!plantilla) return;
        setForm((f) => ({
            ...f,
            descripcionMacroscopica: plantilla.macro,
            descripcionMicroscopica: plantilla.micro,
            diagnostico: plantilla.diagnostico,
        }));
    }

    function elegirCie10(d: DiagnosticoCie10) {
        setForm((f) => ({ ...f, codigoDiagnostico: d.codigoDiagnostico }));
        setCie10Nombre(d.nombreDiagnostico ?? "");
        setCie10Query(d.codigoDiagnostico);
        setCie10Resultados([]);
    }

    async function guardarInforme() {
        if (!ordenActiva) return;
        setFormError(null);

        if (!form.tipoMuestra || !form.diagnostico || !form.codigoDiagnostico) {
            setFormError("Tipo de muestra, diagnóstico y código CIE10 son obligatorios.");
            return;
        }

        setGuardando(true);
        try {
            const payload: UpsertPatologiaPayload = {
                idOrden: ordenActiva.id,
                ...form,
            };
            const guardado = await api.post<InformePatologia>("/atenciones/patologia", payload);
            setInformeGuardado(guardado);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el informe");
        } finally {
            setGuardando(false);
        }
    }

    async function descargarPdf() {
        if (!ordenActiva) return;
        setGenerandoPdf(true);
        try {
            const url = await apiFetchBlobUrl(`/atenciones/patologia/orden/${ordenActiva.id}/pdf`);
            window.open(url, "_blank");
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo generar el PDF");
        } finally {
            setGenerandoPdf(false);
        }
    }

    const especimenesOptions = useMemo(
        () => especimenes.map((e) => ({ value: String(e.id), label: e.nombre })),
        [especimenes]
    );

    const plantillasFiltradas = useMemo(() => {
        const q = plantillaQuery.trim().toLowerCase();
        if (!q) return plantillas;
        return plantillas.filter((p) => p.nombre.toLowerCase().includes(q));
    }, [plantillas, plantillaQuery]);

    if (vista === "informe" && ordenActiva) {
        return (
            <div className="space-y-5">
                <div
                    className="flex items-center justify-between rounded-lg border px-6 py-5"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                >
                    <div>
                        <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                            Atenciones · Patologías
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>Informe de Patología — Orden {ordenActiva.consecutivo}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                            <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                Fecha de ingreso: <span className="font-medium">{ordenActiva.fechaIngreso}</span>
                            </p>
                            <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                Fecha de salida:
                                <Input
                                    type="date"
                                    className="h-8 w-auto"
                                    value={form.fechaSalida}
                                    onChange={(e) => setForm((f) => ({ ...f, fechaSalida: e.target.value }))}
                                />
                            </label>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={volverAlListado}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Listado
                    </Button>
                </div>

                <div className="grid grid-cols-10 gap-4">
                    <div className="col-span-10 space-y-4 lg:col-span-3">
                        <PacienteCard p={ordenActiva.paciente} />

                        {plantillas.length > 0 && (
                            <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                <label className="text-[12.5px] font-medium">Plantilla rápida</label>
                                <div className="relative mt-1.5">
                                    <Input
                                        placeholder="Buscar plantilla…"
                                        value={plantillaQuery}
                                        onChange={(e) => {
                                            setPlantillaQuery(e.target.value);
                                            setPlantillaResultadosAbiertos(true);
                                        }}
                                        onFocus={() => setPlantillaResultadosAbiertos(true)}
                                        onBlur={() => setTimeout(() => setPlantillaResultadosAbiertos(false), 150)}
                                    />
                                    {plantillaResultadosAbiertos && plantillasFiltradas.length > 0 && (
                                        <div
                                            className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                                            style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                        >
                                            {plantillasFiltradas.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                    onClick={() => {
                                                        aplicarPlantilla(String(p.id));
                                                        setPlantillaQuery(p.nombre);
                                                        setPlantillaResultadosAbiertos(false);
                                                    }}
                                                >
                                                    {p.nombre}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {estudiosAnteriores.length > 0 && (
                            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                <p className="border-b px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "var(--border-default)" }}>
                                    Estudios Anteriores
                                </p>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Orden</TableHead>
                                            <TableHead>Espécimen / Estudio</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estudiosAnteriores.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="text-sm font-medium">{e.orden.consecutivo}</TableCell>
                                                <TableCell className="text-xs">
                                                    {e.orden.especimen?.nombre ?? "—"}
                                                    {e.orden.tipoEstudio?.nombreTipoEstudio
                                                        ? ` - ${e.orden.tipoEstudio.nombreTipoEstudio}`
                                                        : ""}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" title="Vista previa" onClick={() => setPreviewAnterior(e)}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>

                    <div className="col-span-10 space-y-4 lg:col-span-7">
                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Tipo de muestra</label>
                                    <Input
                                        value={form.tipoMuestra}
                                        onChange={(e) => setForm((f) => ({ ...f, tipoMuestra: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Sitio de lesión</label>
                                    <Input
                                        value={form.sitioLesion}
                                        onChange={(e) => setForm((f) => ({ ...f, sitioLesion: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Estudio solicitado</label>
                                    <Input
                                        value={form.solicitado}
                                        onChange={(e) => setForm((f) => ({ ...f, solicitado: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Espécimen</label>
                                    <select
                                        className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                        value={form.idEspecimen ?? ""}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, idEspecimen: Number(e.target.value) || undefined }))
                                        }
                                    >
                                        <option value="">Sin cambio</option>
                                        {especimenesOptions.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Descripción macroscópica</label>
                                <RichTextEditor
                                    rows={3}
                                    value={form.descripcionMacroscopica}
                                    onChange={(html) => setForm((f) => ({ ...f, descripcionMacroscopica: html }))}
                                />
                            </div>

                            <div className="mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Descripción microscópica</label>
                                <RichTextEditor
                                    rows={3}
                                    value={form.descripcionMicroscopica}
                                    onChange={(html) => setForm((f) => ({ ...f, descripcionMicroscopica: html }))}
                                />
                            </div>

                            <div className="mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Diagnóstico</label>
                                <RichTextEditor
                                    rows={3}
                                    value={form.diagnostico}
                                    onChange={(html) => setForm((f) => ({ ...f, diagnostico: html }))}
                                />
                            </div>

                            <div className="relative mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Código CIE10</label>
                                <Input
                                    placeholder="Buscar por código o nombre…"
                                    value={cie10Query}
                                    onChange={(e) => setCie10Query(e.target.value)}
                                />
                                {cie10Nombre && (
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                                        {form.codigoDiagnostico} — {cie10Nombre}
                                    </p>
                                )}
                                {cie10Resultados.length > 0 && (
                                    <div
                                        className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                                        style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                    >
                                        {cie10Resultados.map((d) => (
                                            <button
                                                key={d.codigoDiagnostico}
                                                type="button"
                                                className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                onClick={() => elegirCie10(d)}
                                            >
                                                <span className="font-semibold">{d.codigoDiagnostico}</span> —{" "}
                                                {d.nombreDiagnostico}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Observaciones</label>
                                <Textarea
                                    rows={2}
                                    value={form.observaciones}
                                    onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                                />
                            </div>

                            {formError && (
                                <p
                                    className="mt-3 rounded-md px-3 py-2 text-[12.5px]"
                                    style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-2">
                                {(form.descripcionMacroscopica || form.descripcionMicroscopica || form.diagnostico) && (
                                    <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
                                        <Eye size={14} />
                                        Vista previa
                                    </Button>
                                )}
                                {informeGuardado && (
                                    <Button variant="outline" onClick={descargarPdf} disabled={generandoPdf}>
                                        {generandoPdf ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                                        Descargar PDF
                                    </Button>
                                )}
                                <Button onClick={guardarInforme} disabled={guardando}>
                                    {guardando && <Loader2 className="animate-spin" size={14} />}
                                    Guardar Informe
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <HtmlPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    titulo={`Orden ${ordenActiva.numeroOrden}`}
                    maxWidthClassName="max-w-4xl"
                    secciones={[
                        { titulo: "Descripción macroscópica", html: form.descripcionMacroscopica },
                        { titulo: "Descripción microscópica", html: form.descripcionMicroscopica },
                        { titulo: "Diagnóstico", html: form.diagnostico },
                    ]}
                />

                <HtmlPreviewDialog
                    open={!!previewAnterior}
                    onOpenChange={(open) => !open && setPreviewAnterior(null)}
                    titulo={`Orden ${previewAnterior?.orden.consecutivo ?? ""}`}
                    maxWidthClassName="max-w-4xl"
                    secciones={[
                        { titulo: "Descripción macroscópica", html: previewAnterior?.descripcionMacroscopica ?? "" },
                        { titulo: "Descripción microscópica", html: previewAnterior?.descripcionMicroscopica ?? "" },
                        { titulo: "Diagnóstico", html: previewAnterior?.diagnostico ?? "" },
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
                    <h1 style={{ color: "var(--ink-primary)" }}>Patologías</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Órdenes pendientes de informe de patología
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => cargarPendientes(searchTerm)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && (
                <p
                    className="rounded-md px-4 py-2.5 text-[13px]"
                    style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                >
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
                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Espécimen / Estudio</span></TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    No hay órdenes pendientes de informe.
                                </TableCell>
                            </TableRow>
                        )}
                        {pendientes.map((orden) => {
                            const p = orden.paciente;
                            return (
                                <TableRow key={orden.id} className="align-top hover:bg-muted/40">
                                    <TableCell className="py-3">
                                        <p className="font-bold">{orden.consecutivo}</p>
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CalendarDays className="h-3 w-3" />
                                            {orden.fechaIngreso}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <p className="font-bold">{nombrePaciente(p).toUpperCase()}</p>
                                        {p && (
                                            <p className="text-xs text-muted-foreground">
                                                {p.idTipoIdentificacion}
                                                {p.identificacion} · {p.sexo === "M" ? "M" : "F"} ·{" "}
                                                {calcularEdad(p.fechaNacimiento)} años
                                                {p.telefono ? ` · ${p.telefono}` : ""}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-sm">
                                        {orden.especimen?.nombre ?? "—"}
                                        {orden.tipoEstudio?.nombreTipoEstudio ? ` - ${orden.tipoEstudio.nombreTipoEstudio}` : ""}
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                        {orden.tieneInforme ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Con informe</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pendiente</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                        <Button size="sm" onClick={() => abrirOrden(orden)}>
                                            <Microscope size={14} />
                                            Informar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
