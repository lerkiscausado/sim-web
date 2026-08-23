"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDown, Loader2, Microscope, RefreshCw, Eye, Hash, User, IdCard, TestTube2, FlaskConical, CalendarDays } from "lucide-react";
import { api, apiFetchBlobUrl, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlPreviewDialog } from "@/components/ui/html-preview-dialog";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import type {
    OrdenPendiente,
    Especimen,
    PlantillaPatologia,
    DiagnosticoCie10,
    InformePatologia,
    UpsertPatologiaPayload,
} from "./types";
import { nombrePaciente } from "./types";

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
};

export default function PatologiasPage() {
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [especimenes, setEspecimenes] = useState<Especimen[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaPatologia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const cargarPendientes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [pend, esp, plant] = await Promise.all([
                api.get<OrdenPendiente[]>("/atenciones/patologia/pendientes"),
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
        cargarPendientes();
    }, [cargarPendientes]);

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
                });
                setCie10Query(existente.codigoDiagnostico);
                setInformeGuardado(existente);
            }
        } catch {
            // no hay informe previo todavía, se deja el formulario en blanco
        }
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
            await cargarPendientes();
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
                <Button variant="outline" size="sm" onClick={cargarPendientes} disabled={loading}>
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

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Paciente</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" />Identificación</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Espécimen</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" />Estudio</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Fecha ingreso</span></TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    No hay órdenes pendientes de informe.
                                </TableCell>
                            </TableRow>
                        )}
                        {pendientes.map((orden) => (
                            <TableRow key={orden.id}>
                                <TableCell className="font-medium">{orden.numeroOrden}</TableCell>
                                <TableCell>{nombrePaciente(orden.paciente)}</TableCell>
                                <TableCell>{orden.paciente?.identificacion ?? "—"}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{orden.especimen?.nombre ?? "—"}</Badge>
                                </TableCell>
                                <TableCell>{orden.tipoEstudio?.nombreTipoEstudio ?? "—"}</TableCell>
                                <TableCell>{orden.fechaIngreso}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" onClick={() => abrirOrden(orden)}>
                                        <Microscope size={14} />
                                        Informar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!ordenActiva} onOpenChange={(open) => !open && setOrdenActiva(null)}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Informe de patología — Orden {ordenActiva?.numeroOrden}
                        </DialogTitle>
                        <DialogDescription>
                            Paciente: {nombrePaciente(ordenActiva?.paciente)} · {ordenActiva?.paciente?.identificacion}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {plantillas.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[12.5px] font-medium">Plantilla rápida</label>
                                <select
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    defaultValue=""
                                    onChange={(e) => aplicarPlantilla(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Elegir plantilla…
                                    </option>
                                    {plantillas.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

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
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Estudio solicitado</label>
                            <Input
                                value={form.solicitado}
                                onChange={(e) => setForm((f) => ({ ...f, solicitado: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-1.5">
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

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción macroscópica</label>
                            <RichTextEditor
                                rows={3}
                                value={form.descripcionMacroscopica}
                                onChange={(html) => setForm((f) => ({ ...f, descripcionMacroscopica: html }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción microscópica</label>
                            <RichTextEditor
                                rows={3}
                                value={form.descripcionMicroscopica}
                                onChange={(html) => setForm((f) => ({ ...f, descripcionMicroscopica: html }))}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Diagnóstico</label>
                            <RichTextEditor
                                rows={3}
                                value={form.diagnostico}
                                onChange={(html) => setForm((f) => ({ ...f, diagnostico: html }))}
                            />
                        </div>

                        <div className="relative space-y-1.5">
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

                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Observaciones</label>
                            <Textarea
                                rows={2}
                                value={form.observaciones}
                                onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
                            />
                        </div>

                        {formError && (
                            <p
                                className="rounded-md px-3 py-2 text-[12.5px]"
                                style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                            >
                                {formError}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
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
                            Guardar informe
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <HtmlPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                titulo={`Orden ${ordenActiva?.numeroOrden ?? ""}`}
                secciones={[
                    { titulo: "Descripción macroscópica", html: form.descripcionMacroscopica },
                    { titulo: "Descripción microscópica", html: form.descripcionMicroscopica },
                    { titulo: "Diagnóstico", html: form.diagnostico },
                ]}
            />
        </div>
    );
}
