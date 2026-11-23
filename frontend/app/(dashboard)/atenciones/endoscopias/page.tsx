"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Activity, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, PenLine, Lock, CheckCircle2, AlertCircle, MessageSquarePlus, FileSignature, Wand2, FileText } from "lucide-react";
import { api, ApiError, apiFetchBlobUrl } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pildora } from "@/components/ui/panel";
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
import type { OrdenPendiente, EndoscopiaData, EstudioAnterior, PacienteEndoscopia, EndoscopiaFirmada, Adenda } from "./types";
import { nombrePaciente, calcularEdad, pestanasPorEstudio, CAMPOS_EDITABLES_ENDOSCOPIA } from "./types";
import { hoyISO } from "@/lib/fechas";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";
import { Buscador } from "@/components/ui/buscador";
import { usePaginacionLocal } from "@/lib/useTabla";
import { PaginationControls } from "@/components/ui/pagination-controls";

function FORM_INICIAL(): EndoscopiaData {
    return {
        idOrden: 0,
        idDetalleOrden: 0,
        fechaEstudio: hoyISO(),
        fechaSalida: hoyISO(),
        medicoSolicita: "",
        indicacion: "",
        medicamentos: "",
        idEquipo: undefined,
        idProcedimientoTerapeutico: undefined,
        anestesiologo: "",
        campo1: "",
        campo2: "",
        campo3: "",
        campo4: "",
        campo5: ".",
        campo6: "",
        diagnostico: "",
        codigoDiagnostico: "",
        tomaBiopsia: "NO",
        biopsia: "",
    };
}

/** Solo los campos que acepta el backend (rechaza cualquier otro). */
function payloadEndoscopia(form: EndoscopiaData) {
    const out: Record<string, unknown> = {};
    for (const k of CAMPOS_EDITABLES_ENDOSCOPIA) {
        const v = form[k as keyof EndoscopiaData];
        if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
}

function fechaHora(v?: string | null) {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

type PestanaReporte = "campo1" | "campo2" | "campo3" | "campo4" | "campo5";

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
type Bandeja = "pendientes" | "firmadas";

export default function EndoscopiasPage() {
    const { avisar, confirmar } = useFeedback();
    const [bandeja, setBandeja] = useState<Bandeja>("pendientes");
    const [firmadas, setFirmadas] = useState<EndoscopiaFirmada[]>([]);
    const [pestana, setPestana] = useState<PestanaReporte>("campo1");
    const [faltantes, setFaltantes] = useState<string[] | null>(null);
    const [adendas, setAdendas] = useState<Adenda[]>([]);
    const [adendaTexto, setAdendaTexto] = useState("");
    const [guardandoAdenda, setGuardandoAdenda] = useState(false);
    const [aplicandoPlantilla, setAplicandoPlantilla] = useState(false);
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState<EndoscopiaData>(FORM_INICIAL());
    /** Resolución 3100: un estudio firmado no se edita; solo admite adendas. */
    const soloLectura = !!form.firmada;
    const pest = pestanasPorEstudio(ordenActiva?.estudio);
    const PESTANAS: { clave: PestanaReporte; texto: string }[] = [
        { clave: "campo1", texto: "Descripción" },
        { clave: "campo2", texto: pest.campo2 },
        { clave: "campo3", texto: pest.campo3 },
        { clave: "campo4", texto: pest.campo4 },
        ...(pest.elcb ? [{ clave: "campo5" as const, texto: "ELCB" }] : []),
    ];
    const [guardando, setGuardando] = useState(false);
    const [firmando, setFirmando] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const v = useValidacion(form, {
        fechaEstudio: [reglas.requerido("La fecha del estudio es obligatoria."), reglas.fecha(), reglas.fechaNoFutura()],
        fechaSalida: [reglas.fecha(), reglas.fechaDesde<EndoscopiaData>("fechaEstudio", "la fecha del estudio")],
        medicoSolicita: [reglas.requerido("Indica el médico que solicita."), reglas.maxLong(100)],
        anestesiologo: [reglas.maxLong(100)],
        indicacion: [reglas.requerido("La indicación es obligatoria.")],
        idEquipo: [reglas.requerido("Selecciona el equipo.")],
        idProcedimientoTerapeutico: [reglas.requerido("Selecciona el procedimiento terapéutico.")],
        campo1: [reglas.requerido("La descripción del procedimiento es obligatoria.")],
        diagnostico: [reglas.requerido("El diagnóstico es obligatorio.")],
    });
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);

    const [equipos, setEquipos] = useState<{ id: number; nombre: string }[]>([]);
    const [procedimientos, setProcedimientos] = useState<{ id: number; nombre: string }[]>([]);
    const [cie10Query, setCie10Query] = useState("");
    const [cie10Resultados, setCie10Resultados] = useState<{ codigoDiagnostico: string; nombreDiagnostico: string | null }[]>([]);
    const [cie10Nombre, setCie10Nombre] = useState("");
    const tablaPendientes = usePaginacionLocal(pendientes, "pendientes-endoscopias");
    const tablaFirmadas = usePaginacionLocal(firmadas, "firmadas-endoscopias");

    const cargarPendientes = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const [pend, firm] = await Promise.all([
                api.get<OrdenPendiente[]>(`/atenciones/endoscopias/pendientes${qs}`),
                api.get<EndoscopiaFirmada[]>(`/atenciones/endoscopias/firmadas${qs}`).catch(() => [] as EndoscopiaFirmada[]),
            ]);
            setPendientes(pend);
            setFirmadas(firm);
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
        v.reiniciar();
        setCie10Query("");
        setCie10Nombre("");
        setPestana("campo1");
        setFaltantes(null);
        setAdendas([]);
        setAdendaTexto("");
        setVista("informe");
        cargarFaltantes(orden.idDetalleOrden);
        api
            .get<Adenda[]>(`/atenciones/endoscopias/detalle-orden/${orden.idDetalleOrden}/adendas`)
            .then(setAdendas)
            .catch(() => setAdendas([]));

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
                setForm({ ...FORM_INICIAL(), idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden, campo6: orden.nombreCups });
            }
        } catch {
            setForm({ ...FORM_INICIAL(), idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden, campo6: orden.nombreCups });
        }
    }

    function cargarFaltantes(idDetalleOrden: number) {
        api.get<string[]>(`/atenciones/endoscopias/detalle-orden/${idDetalleOrden}/faltantes`)
            .then(setFaltantes)
            .catch(() => setFaltantes(null));
    }

    /** bbiAplicarPlantilla: trae la plantilla del especialista para este tipo de estudio. */
    async function aplicarPlantilla() {
        if (!ordenActiva?.idTipoEstudio || soloLectura) return;
        const hayTexto = [form.campo1, form.campo2, form.campo3, form.campo4, form.diagnostico].some(
            (t) => (t ?? "").replace(/<[^>]*>/g, "").trim(),
        );
        if (hayTexto && !(await confirmar({ titulo: "¿Aplicar la plantilla?", mensaje: "Se reemplazará el texto que ya escribió en el informe." }))) return;
        setAplicandoPlantilla(true);
        try {
            const p = await api.get<Partial<EndoscopiaData> | null>(`/atenciones/endoscopias/plantilla/${ordenActiva.idTipoEstudio}`);
            if (!p) {
                avisar.info("No tiene una plantilla para este tipo de estudio. Puede crearla en Administración → Plantillas.");
                return;
            }
            setForm((f) => ({ ...f, ...p }));
            avisar.exito("Plantilla aplicada.");
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo traer la plantilla");
        } finally {
            setAplicandoPlantilla(false);
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
        if (!ordenActiva || soloLectura) return;
        setFormError(null);
        if (!v.comprobar()) return;
        setGuardando(true);
        try {
            await api.post("/atenciones/endoscopias", payloadEndoscopia(form));
            avisar.exito("Reporte guardado.");
            cargarFaltantes(ordenActiva.idDetalleOrden);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el reporte");
        } finally {
            setGuardando(false);
        }
    }

    async function firmarReporte() {
        if (!ordenActiva || soloLectura || !v.comprobar()) return;
        const ok = await confirmar({
            titulo: "¿Firmar el estudio?",
            mensaje: "Si continúa no se podrán hacer cambios en el estudio (Resolución 3100). Las correcciones se harán con adendas.",
            textoAceptar: "Firmar",
            peligro: true,
        });
        if (!ok) return;
        setFirmando(true);
        setFormError(null);
        try {
            await api.post("/atenciones/endoscopias", payloadEndoscopia(form));
            await api.patch(`/atenciones/endoscopias/detalle-orden/${ordenActiva.idDetalleOrden}/firmar`);
            avisar.exito("Estudio firmado.");
            volverAlListado();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo firmar el reporte");
            cargarFaltantes(ordenActiva.idDetalleOrden);
        } finally {
            setFirmando(false);
        }
    }

    async function agregarAdenda() {
        if (!ordenActiva || !adendaTexto.trim()) return;
        setGuardandoAdenda(true);
        try {
            const lista = await api.post<Adenda[]>(
                `/atenciones/endoscopias/detalle-orden/${ordenActiva.idDetalleOrden}/adendas`,
                { texto: adendaTexto.trim() },
            );
            setAdendas(lista);
            setAdendaTexto("");
            avisar.exito("Adenda agregada.");
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo agregar la adenda");
        } finally {
            setGuardandoAdenda(false);
        }
    }

    if (vista === "informe" && ordenActiva) {
        return (
            <div className="space-y-5">
                <div className="flex items-center justify-between encabezado-modulo">
                    <div>
                        <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                            Atenciones · Endoscopias
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>Informe de {ordenActiva.estudio} — Orden {ordenActiva.consecutivo || ordenActiva.idOrden}</h1>
                        <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                            {ordenActiva.nombreCups} · Fecha de ingreso: {ordenActiva.fechaIngreso}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
                            {soloLectura ? (
                                <Pildora tono="exito">
                                    <Lock className="mr-1 inline h-3 w-3" />
                                    Firmado{form.fechaFirma ? ` el ${fechaHora(form.fechaFirma)}` : ""}
                                </Pildora>
                            ) : (
                                <Pildora tono="neutro">Borrador</Pildora>
                            )}
                            {!soloLectura && faltantes && faltantes.length > 0 && (
                                <span className="inline-flex items-center gap-1" style={{ color: "var(--status-danger, #dc2626)" }}>
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Falta: {faltantes.join(", ")}
                                </span>
                            )}
                            {!soloLectura && faltantes && faltantes.length === 0 && (
                                <span className="inline-flex items-center gap-1" style={{ color: "var(--status-success, #16a34a)" }}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Listo para firmar
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            title="Informe en PDF (sale como borrador hasta que se firme)"
                            onClick={async () => {
                                try {
                                    window.open(await apiFetchBlobUrl(`/atenciones/endoscopias/detalle-orden/${ordenActiva.idDetalleOrden}/pdf`), "_blank");
                                } catch {
                                    avisar.error("Guarde primero para poder ver el PDF.");
                                }
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Ver PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={volverAlListado}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Listado
                        </Button>
                    </div>
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
                        <fieldset disabled={soloLectura} className="contents">
                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-bold">Datos del Procedimiento</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Campo label="Fecha de Estudio" nombre="fechaEstudio" error={v.error("fechaEstudio")} requerido>
                                    <Input type="date" value={form.fechaEstudio} onChange={(e) => setForm((f) => ({ ...f, fechaEstudio: e.target.value }))} />
                                </Campo>
                                <Campo label="Fecha de Salida" nombre="fechaSalida" error={v.error("fechaSalida")}>
                                    <Input type="date" value={form.fechaSalida ?? ""} onChange={(e) => setForm((f) => ({ ...f, fechaSalida: e.target.value }))} />
                                </Campo>
                                <Campo label="Médico que Solicita" nombre="medicoSolicita" error={v.error("medicoSolicita")} requerido>
                                    <Input value={form.medicoSolicita} onChange={(e) => setForm((f) => ({ ...f, medicoSolicita: e.target.value }))} />
                                </Campo>
                                <Campo label="Anestesiólogo" nombre="anestesiologo" error={v.error("anestesiologo")}>
                                    <Input value={form.anestesiologo ?? ""} onChange={(e) => setForm((f) => ({ ...f, anestesiologo: e.target.value }))} />
                                </Campo>
                                <Campo label="Indicación" nombre="indicacion" error={v.error("indicacion")} requerido className="col-span-2">
                                    <Input value={form.indicacion} onChange={(e) => setForm((f) => ({ ...f, indicacion: e.target.value }))} />
                                </Campo>
                                <Campo label="Medicamentos" nombre="medicamentos" error={v.error("medicamentos")} className="col-span-2">
                                    <Input value={form.medicamentos ?? ""} onChange={(e) => setForm((f) => ({ ...f, medicamentos: e.target.value }))} />
                                </Campo>
                                <Campo label="Equipo" nombre="idEquipo" error={v.error("idEquipo")} requerido>
                                    <Select className="w-full" value={form.idEquipo ?? ""} onChange={(e) => setForm((f) => ({ ...f, idEquipo: Number(e.target.value) || undefined }))}>
                                        <option value="">Seleccionar…</option>
                                        {equipos.map((eq) => <option key={eq.id} value={eq.id}>{eq.nombre}</option>)}
                                    </Select>
                                </Campo>
                                <Campo label="Procedimiento Terapéutico" nombre="idProcedimientoTerapeutico" error={v.error("idProcedimientoTerapeutico")} requerido>
                                    <Select className="w-full" value={form.idProcedimientoTerapeutico ?? ""} onChange={(e) => setForm((f) => ({ ...f, idProcedimientoTerapeutico: Number(e.target.value) || undefined }))}>
                                        <option value="">Seleccionar…</option>
                                        {procedimientos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </Select>
                                </Campo>
                            </div>
                        </div>

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-bold">Informe de {ordenActiva.estudio}</p>
                                <div className="flex gap-2">
                                    {!soloLectura && (
                                        <Button type="button" variant="outline" size="sm" onClick={aplicarPlantilla} disabled={aplicandoPlantilla || !ordenActiva.idTipoEstudio}>
                                            {aplicandoPlantilla ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1.5 h-3.5 w-3.5" />}
                                            Aplicar plantilla
                                        </Button>
                                    )}
                                    {form.campo1 && (
                                        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                                            Vista previa
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border-default)" }}>
                                {PESTANAS.map((p) => {
                                    const vacio = p.clave !== "campo5" && !(form[p.clave] ?? "").replace(/<[^>]*>/g, "").trim();
                                    return (
                                        <button
                                            key={p.clave}
                                            type="button"
                                            onClick={() => setPestana(p.clave)}
                                            className="-mb-px border-b-2 px-3 py-1.5 text-[12.5px] font-medium"
                                            style={{
                                                borderColor: pestana === p.clave ? "var(--ink-brand, #e5322b)" : "transparent",
                                                color: pestana === p.clave ? "var(--ink-primary)" : "var(--ink-secondary)",
                                            }}
                                        >
                                            {p.texto}
                                            {vacio && !soloLectura && <span style={{ color: "var(--status-danger, #dc2626)" }}> *</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            {pestana === "campo1" && (
                                <Campo nombre="campo1" error={v.error("campo1")}>
                                    <RichTextEditor disabled={soloLectura} rows={8} value={form.campo1} onChange={(html) => setForm((f) => ({ ...f, campo1: html }))} />
                                </Campo>
                            )}
                            {(["campo2", "campo3", "campo4"] as const).map((c) =>
                                pestana === c ? (
                                    <RichTextEditor key={c} disabled={soloLectura} rows={8} value={form[c] ?? ""} onChange={(html) => setForm((f) => ({ ...f, [c]: html }))} />
                                ) : null,
                            )}
                            {pestana === "campo5" && pest.elcb && (
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium">ELCB</label>
                                    <Input value={form.campo5 ?? ""} onChange={(e) => setForm((f) => ({ ...f, campo5: e.target.value }))} />
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-bold">Diagnóstico</p>
                            <Campo nombre="diagnostico" error={v.error("diagnostico")}>
                                <RichTextEditor disabled={soloLectura} rows={4} value={form.diagnostico} onChange={(html) => setForm((f) => ({ ...f, diagnostico: html }))} />
                            </Campo>

                            <div className="relative mt-3 space-y-1.5">
                                <label className="text-[13px] font-medium">Código CIE10</label>
                                <Buscador
                                    placeholder="Buscar por código o nombre…" texto={cie10Query} onTexto={(t) => setCie10Query(t)}
                                    resultados={cie10Resultados}
                                    claveDe={(d) => d.codigoDiagnostico}
                                    onElegir={(d) => elegirCie10(d)}
                                    renderItem={(d) => (
                                        <>
                                            <span className="font-semibold">{d.codigoDiagnostico}</span> — {d.nombreDiagnostico}
                                        </>
                                    )}
                                    sinResultados="No se encontraron diagnósticos."
                                />
                                {cie10Nombre && (
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>{form.codigoDiagnostico} — {cie10Nombre}</p>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-4 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium">Toma de biopsia</label>
                                    <Select className="w-full" value={form.tomaBiopsia ?? "NO"} onChange={(e) => setForm((f) => ({ ...f, tomaBiopsia: e.target.value as "NO" | "SI" }))}>
                                        <option value="NO">NO</option>
                                        <option value="SI">SI</option>
                                    </Select>
                                </div>
                                <div className="col-span-3 space-y-1.5">
                                    <label className="text-[13px] font-medium">Descripción de la biopsia{form.tomaBiopsia === "SI" ? " *" : ""}</label>
                                    <Textarea
                                        rows={2}
                                        value={form.biopsia ?? ""}
                                        disabled={form.tomaBiopsia !== "SI"}
                                        onChange={(e) => setForm((f) => ({ ...f, biopsia: e.target.value }))}
                                        placeholder={form.tomaBiopsia === "SI" ? "Sitio, número de fragmentos…" : "Seleccione SI para describir la biopsia"}
                                    />
                                </div>
                            </div>
                        </div>
                        </fieldset>

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>

                            <ResumenErrores mensaje={v.resumen} />

                            {formError && (
                                <p className="mt-3 rounded-md px-3 py-2 text-[12.5px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>
                                    {formError}
                                </p>
                            )}

                            {soloLectura ? (
                                <div className="space-y-3">
                                    <p className="flex items-center gap-2 text-sm font-bold">
                                        <FileSignature className="h-4 w-4" />
                                        Adendas
                                    </p>
                                    <p className="text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
                                        El estudio está firmado y no se puede modificar (Resolución 3100). Para corregir o aclarar, agregue una adenda.
                                    </p>
                                    {adendas.length === 0 ? (
                                        <p className="text-[12.5px] text-muted-foreground">Sin adendas.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {adendas.map((a) => (
                                                <div key={a.id} className="rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <p className="mb-1 text-xs text-muted-foreground">
                                                        {fechaHora(a.fechaHora)} · {a.autor ?? `Usuario ${a.idUsuario ?? "—"}`}
                                                    </p>
                                                    <p className="whitespace-pre-wrap">{a.texto}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Textarea rows={3} value={adendaTexto} onChange={(e) => setAdendaTexto(e.target.value)} placeholder="Texto de la adenda…" />
                                    <Button onClick={agregarAdenda} disabled={guardandoAdenda || !adendaTexto.trim()}>
                                        {guardandoAdenda ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="mr-2 h-4 w-4" />}
                                        Agregar adenda
                                    </Button>
                                </div>
                            ) : (
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={guardarInforme} disabled={guardando}>
                                    {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Reporte
                                </Button>
                                <Button variant="outline" onClick={firmarReporte} disabled={firmando}>
                                    {firmando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                                    Firmar y Cerrar
                                </Button>
                            </div>
                            )}
                        </div>
                    </div>
                </div>

                <HtmlPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    titulo={`Orden ${ordenActiva.consecutivo || ordenActiva.idOrden}`}
                    maxWidthClassName="max-w-4xl"
                    secciones={[
                        { titulo: "Descripción", html: form.campo1 },
                        { titulo: pest.campo2, html: form.campo2 ?? "" },
                        { titulo: pest.campo3, html: form.campo3 ?? "" },
                        { titulo: pest.campo4, html: form.campo4 ?? "" },
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
            <div className="flex items-center justify-between encabezado-modulo">
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Endoscopias</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        {bandeja === "pendientes"
                            ? "Tus pacientes pendientes de reporte de endoscopia"
                            : "Estudios que ya firmaste: consúltalos o agrega adendas"}
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

            <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-default)" }}>
                {([
                    ["pendientes", `Pendientes (${pendientes.length})`],
                    ["firmadas", `Firmados (${firmadas.length})`],
                ] as const).map(([valor, texto]) => (
                    <button
                        key={valor}
                        type="button"
                        onClick={() => setBandeja(valor)}
                        className="-mb-px border-b-2 px-3 py-2 text-[13px] font-medium"
                        style={{
                            borderColor: bandeja === valor ? "var(--ink-brand, #e5322b)" : "transparent",
                            color: bandeja === valor ? "var(--ink-primary)" : "var(--ink-secondary)",
                        }}
                    >
                        {texto}
                    </button>
                ))}
            </div>

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

            {bandeja === "firmadas" ? (
            <>
            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Paciente</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Estudio</span></TableHead>
                            <TableHead>Firmado</TableHead>
                            <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && firmadas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    No hay estudios firmados.
                                </TableCell>
                            </TableRow>
                        )}
                        {tablaFirmadas.visibles.map((h) => (
                            <TableRow key={h.idDetalleOrden} className="align-top hover:bg-muted/40">
                                <TableCell className="py-3">
                                    <p className="font-bold">{h.consecutivo || h.idOrden}</p>
                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <CalendarDays className="h-3 w-3" />
                                        {h.fechaIngreso}
                                    </p>
                                </TableCell>
                                <TableCell className="py-3">
                                    <p className="font-bold">{nombrePaciente(h.paciente).toUpperCase()}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {h.paciente.idTipoIdentificacion}
                                        {h.paciente.identificacion}
                                    </p>
                                </TableCell>
                                <TableCell className="py-3 text-sm">
                                    <Badge variant="secondary">{h.estudio}</Badge>
                                    <p className="mt-1 text-xs text-muted-foreground">{h.nombreCups}</p>
                                </TableCell>
                                <TableCell className="py-3 text-xs">
                                    {fechaHora(h.fechaFirma)}
                                    {h.adendas > 0 && <p className="text-muted-foreground">{h.adendas} adenda{h.adendas === 1 ? "" : "s"}</p>}
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                    <Button size="sm" variant="outline" onClick={() => abrirOrden(h)}>
                                        <Eye size={14} />
                                        Ver
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls {...tablaFirmadas.paginacion} />
            </>
            ) : (
            <>
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
                        {tablaPendientes.visibles.map((orden) => (
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
            <PaginationControls {...tablaPendientes.paginacion} />
            </>
            )}
        </div>
    );
}
