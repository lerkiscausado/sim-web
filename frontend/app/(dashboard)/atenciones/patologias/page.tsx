"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Loader2, Microscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, Save, PenLine, Camera, BookOpenText, Paperclip } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion, type Regla } from "@/lib/validacion";
import { abrirPdf } from "@/lib/descargas";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, htmlToPlainText } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImagenesDialog } from "@/components/ordenes/ImagenesDialog";
import { AdjuntosDialog } from "@/components/ordenes/AdjuntosDialog";
import type { OrdenPendiente, PlantillaPatologia, DiagnosticoCie10, InformePatologia, UpsertPatologiaPayload, EstudioAnterior } from "./types";
import { nombrePaciente, calcularEdad } from "./types";
import { hoyISO } from "@/lib/fechas";
import { useFeedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select";
import { Buscador } from "@/components/ui/buscador";
import { useAvisoSalida } from "@/lib/useAvisoSalida";
import { PacienteCard, EspecimenPicker } from "./componentes";

const hoy = hoyISO;

/**
 * Campos de frmPatologiaCD (licencia 16). En la BD conservan sus nombres
 * históricos: Impresión Diagnóstica → descripcionMacroscopica, Resultado →
 * descripcionMicroscopica, Descripción del Estudio → diagnostico.
 */
const FORM_INICIAL = {
    tipoMuestra: "",
    idEspecimen: undefined as number | undefined,
    sitioLesion: "",
    solicitado: "",
    impresionDiagnostica: "",
    resultado: "",
    descripcion: "",
    observaciones: "",
    codigoDiagnostico: "",
    fechaSalida: hoy(),
};
type Form = typeof FORM_INICIAL;

type Vista = "listado" | "informe";

export default function PatologiasPage() {
    const { hasPermission } = useAuth();
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [plantillas, setPlantillas] = useState<PlantillaPatologia[]>([]);
    const [sedes, setSedes] = useState<{ id: number; nombre: string }[]>([]);
    const [idSede, setIdSede] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState<Form>(FORM_INICIAL);
    const [cambios, setCambios] = useState(false);
    const [cie10Query, setCie10Query] = useState("");
    const [cie10Resultados, setCie10Resultados] = useState<DiagnosticoCie10[]>([]);
    const [cie10Nombre, setCie10Nombre] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [firmar, setFirmar] = useState(false);
    const [confirmarFirma, setConfirmarFirma] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [errorDlg, setErrorDlg] = useState<{ titulo: string; mensaje?: string; detalles?: string[] } | null>(null);
    const [informeGuardado, setInformeGuardado] = useState<InformePatologia | null>(null);
    const [plantillaQuery, setPlantillaQuery] = useState("");
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [dialogo, setDialogo] = useState<"imagenes" | "adjuntos" | null>(null);
    const { confirmar, avisar } = useFeedback();
    useAvisoSalida(cambios);

    /**
     * Validación del formulario. Para guardar basta el espécimen; para firmar se exigen además
     * los campos que pedía el VB.NET (bbiGuardar con chkProcesado). `exigirFirma` se fija antes de validar.
     */
    const exigirFirma = useRef(false);
    const paraFirmar = (regla: Regla<Form>): Regla<Form> => reglas.si<Form>(() => exigirFirma.current, regla);
    const v = useValidacion(form, {
        tipoMuestra: [reglas.requerido("Seleccione el espécimen (tipo de muestra)."), reglas.maxLong(100)],
        fechaSalida: [
            reglas.fecha(),
            (fs) =>
                fs && ordenActiva?.fechaIngreso && String(fs).slice(0, 10) < ordenActiva.fechaIngreso.slice(0, 10)
                    ? "No puede ser anterior a la fecha de ingreso."
                    : null,
        ],
        sitioLesion: [reglas.maxLong(50)],
        solicitado: [reglas.maxLong(50)],
        impresionDiagnostica: [paraFirmar(reglas.requerido("La impresión diagnóstica es obligatoria para firmar."))],
        resultado: [paraFirmar(reglas.requerido("El resultado es obligatorio para firmar."))],
        codigoDiagnostico: [paraFirmar(reglas.requerido("El diagnóstico CIE10 es obligatorio para firmar.")), reglas.maxLong(12)],
        descripcion: [paraFirmar(reglas.requerido("La descripción del estudio es obligatoria para firmar."))],
    });
    const editorKey = useRef(0);

    const cargarPendientes = useCallback(async (q?: string, sede?: string) => {
        setLoading(true);
        setError(null);
        try {
            const p = new URLSearchParams();
            if (q) p.set("q", q);
            if (sede) p.set("idSede", sede);
            const [pend, plant] = await Promise.all([
                api.get<OrdenPendiente[]>(`/atenciones/patologia/pendientes?${p.toString()}`),
                api.get<PlantillaPatologia[]>("/atenciones/plantillas-patologia"),
            ]);
            setPendientes(pend);
            setPlantillas(plant);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        api.get<{ id: number; nombre: string }[]>("/admisiones/sedes").then(setSedes).catch(() => undefined);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => cargarPendientes(searchTerm, idSede), 350);
        return () => clearTimeout(t);
    }, [searchTerm, idSede, cargarPendientes]);

    useEffect(() => {
        if (cie10Query.trim().length < 2 || cie10Query === form.codigoDiagnostico) {
            setCie10Resultados([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                setCie10Resultados(await api.get<DiagnosticoCie10[]>(`/catalogos/diagnosticos/search?q=${encodeURIComponent(cie10Query)}`));
            } catch {
                setCie10Resultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [cie10Query, form.codigoDiagnostico]);

    function set<K extends keyof Form>(k: K, v: Form[K]) {
        setForm((f) => ({ ...f, [k]: v }));
        setCambios(true);
    }

    async function abrirOrden(orden: OrdenPendiente) {
        if (
            cambios &&
            ordenActiva &&
            !(await confirmar({
                titulo: "Hay cambios sin guardar",
                mensaje: "Tiene una patología pendiente por guardar. Si continúa se perderán los cambios.",
                textoAceptar: "Descartar y continuar",
                peligro: true,
            }))
        )
            return;
        setOrdenActiva(orden);
        setInformeGuardado(null);
        setFirmar(false);
        v.reiniciar();
        setForm({ ...FORM_INICIAL, idEspecimen: orden.idEspecimen, tipoMuestra: orden.especimen?.nombre ?? "" });
        setCie10Query("");
        setCie10Nombre("");
        setPlantillaQuery("");
        setEstudiosAnteriores([]);
        setCambios(false);
        editorKey.current++;
        setVista("informe");

        api.get<EstudioAnterior[]>(`/atenciones/patologia/paciente/${orden.idUsuario}/estudios-anteriores`)
            .then(setEstudiosAnteriores)
            .catch(() => setEstudiosAnteriores([]));

        try {
            const ex = await api.get<(InformePatologia & { diagnosticoCie10?: DiagnosticoCie10 }) | null>(`/atenciones/patologia/orden/${orden.id}`);
            if (ex) {
                setForm({
                    tipoMuestra: orden.especimen?.nombre ?? ex.tipoMuestra ?? "",
                    idEspecimen: orden.idEspecimen,
                    sitioLesion: ex.sitioLesion?.trim() ?? "",
                    solicitado: ex.solicitado?.trim() ?? "",
                    impresionDiagnostica: ex.descripcionMacroscopica ?? "",
                    resultado: (ex.descripcionMicroscopica ?? "").trim(),
                    descripcion: ex.diagnostico ?? "",
                    observaciones: ex.observaciones ?? "",
                    codigoDiagnostico: (ex.codigoDiagnostico ?? "").trim(),
                    fechaSalida: hoy(), // el VB.NET siempre propone la fecha de hoy al abrir el estudio
                });
                setCie10Query((ex.codigoDiagnostico ?? "").trim());
                setCie10Nombre(ex.diagnosticoCie10?.nombreDiagnostico ?? "");
                setInformeGuardado(ex);
                editorKey.current++;
                setCambios(false);
            }
        } catch {
            // sin informe previo
        }
    }

    async function volverAlListado() {
        if (
            cambios &&
            !(await confirmar({
                titulo: "Hay cambios sin guardar",
                mensaje: "¿Desea salir sin guardar los cambios del estudio?",
                textoAceptar: "Salir sin guardar",
                peligro: true,
            }))
        )
            return;
        setVista("listado");
        setOrdenActiva(null);
        setCambios(false);
        cargarPendientes(searchTerm, idSede);
    }

    async function aplicarPlantilla(p: PlantillaPatologia) {
        if (
            htmlToPlainText(form.descripcion) &&
            !(await confirmar({
                titulo: "¿Reemplazar la descripción?",
                mensaje: `La descripción actual se reemplazará por la plantilla "${p.nombre}".`,
                textoAceptar: "Reemplazar",
            }))
        )
            return;
        editorKey.current++;
        setForm((f) => ({ ...f, descripcion: p.diagnostico || f.descripcion }));
        setCambios(true);
    }

    function elegirCie10(d: DiagnosticoCie10) {
        set("codigoDiagnostico", d.codigoDiagnostico);
        setCie10Nombre(d.nombreDiagnostico ?? "");
        setCie10Query(d.codigoDiagnostico);
        setCie10Resultados([]);
    }

    function payload(): UpsertPatologiaPayload {
        return {
            idOrden: ordenActiva!.id,
            tipoMuestra: form.tipoMuestra.trim(),
            idEspecimen: form.idEspecimen,
            sitioLesion: form.sitioLesion.trim(),
            solicitado: form.solicitado.trim(),
            descripcionMacroscopica: form.impresionDiagnostica.trim(),
            descripcionMicroscopica: form.resultado,
            diagnostico: form.descripcion,
            observaciones: form.observaciones,
            codigoDiagnostico: form.codigoDiagnostico.trim(),
            fechaSalida: form.fechaSalida,
        };
    }

    async function guardar(): Promise<boolean> {
        if (!ordenActiva) return false;
        if (!v.comprobar()) return false;
        setGuardando(true);
        try {
            const g = await api.post<InformePatologia>("/atenciones/patologia", payload());
            setInformeGuardado(g);
            setCambios(false);
            return true;
        } catch (err) {
            setErrorDlg({
                titulo: "No se pudo guardar el estudio",
                mensaje: err instanceof ApiError ? err.message : "Error inesperado",
                detalles: err instanceof ApiError ? err.details : undefined,
            });
            return false;
        } finally {
            setGuardando(false);
        }
    }

    async function onGuardar() {
        exigirFirma.current = firmar;
        const ok = await guardar();
        if (!ok) return;
        if (firmar) setConfirmarFirma(true);
        else avisar.exito("Estudio guardado.");
    }

    async function firmarEstudio() {
        if (!ordenActiva) return;
        setConfirmarFirma(false);
        setGuardando(true);
        try {
            await api.post(`/atenciones/patologia/orden/${ordenActiva.id}/firmar`);
            setCambios(false);
            setVista("listado");
            setOrdenActiva(null);
            setError(null);
            avisar.exito("Estudio firmado. La orden pasó a ATENDIDO.");
            await cargarPendientes(searchTerm, idSede);
        } catch (err) {
            setErrorDlg({
                titulo: "No se pudo firmar el estudio",
                mensaje: err instanceof ApiError ? err.message : "Error inesperado",
                detalles: err instanceof ApiError ? err.details : undefined,
            });
        } finally {
            setGuardando(false);
        }
    }

    /** Vista Preliminar: guarda y muestra el informe con el formato de la sede. */
    async function vistaPreliminar() {
        if (!ordenActiva) return;
        if (cambios || !informeGuardado) {
            exigirFirma.current = false;
            const ok = await guardar();
            if (!ok) return;
        }
        setGenerandoPdf(true);
        try {
            await abrirPdf(`/atenciones/patologia/orden/${ordenActiva.id}/pdf?variante=final`);
        } catch (err) {
            setErrorDlg({ titulo: "No se pudo generar la vista preliminar", mensaje: err instanceof ApiError ? err.message : "Error" });
        } finally {
            setGenerandoPdf(false);
        }
    }

    async function verAnterior(e: EstudioAnterior) {
        try {
            await abrirPdf(`/atenciones/patologia/orden/${e.orden.id}/pdf`);
        } catch (err) {
            setErrorDlg({ titulo: "No se pudo abrir el estudio", mensaje: err instanceof ApiError ? err.message : "Error" });
        }
    }

    const plantillasFiltradas = useMemo(() => {
        const q = plantillaQuery.trim().toLowerCase();
        return q ? plantillas.filter((p) => p.nombre.toLowerCase().includes(q)) : plantillas;
    }, [plantillas, plantillaQuery]);

    const dialogos = (
        <>
            <ErrorDialog
                open={!!errorDlg}
                onOpenChange={(o) => !o && setErrorDlg(null)}
                titulo={errorDlg?.titulo}
                mensaje={errorDlg?.mensaje}
                detalles={errorDlg?.detalles}
            />
            <Dialog open={confirmarFirma} onOpenChange={setConfirmarFirma}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Firmar Estudio</DialogTitle>
                        <DialogDescription>
                            ¿Desea Firmar el Estudio? Si continúa no se podrán hacer cambios en el estudio. La orden pasará a estado ATENDIDO.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmarFirma(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={firmarEstudio}>
                            <PenLine size={14} /> Firmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );

    if (vista === "informe" && ordenActiva) {
        const p = ordenActiva.paciente;
        return (
            <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-6 py-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                    <div>
                        <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                            Atenciones · Patologías
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>
                            {ordenActiva.consecutivo || ordenActiva.id} | {nombrePaciente(p).toUpperCase()}
                            {p ? ` | ${calcularEdad(p.fechaNacimiento)} años` : ""}
                        </h1>
                        <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                            {ordenActiva.tipoEstudio?.nombreTipoEstudio ?? "Estudio"} · Ingreso {ordenActiva.fechaIngreso}
                            {ordenActiva.sede ? ` · Sede ${ordenActiva.sede.nombre}` : ""}
                            {cambios && <span className="ml-2 font-medium text-amber-700">· cambios sin guardar</span>}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={volverAlListado}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Pacientes por atender
                    </Button>
                </div>

                <div className="grid grid-cols-10 gap-4">
                    <div className="col-span-10 space-y-4 lg:col-span-3">
                        <PacienteCard p={p} />

                        {plantillas.length > 0 && (
                            <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                <label className="flex items-center gap-1.5 text-[13px] font-medium">
                                    <BookOpenText size={14} /> Aplicar plantilla al estudio
                                </label>
                                <div className="relative mt-1.5">
                                    <Buscador
                                        conIcono
                                        aria-label="Buscar plantilla"
                                        placeholder="Buscar plantilla…"
                                        texto={plantillaQuery}
                                        onTexto={setPlantillaQuery}
                                        resultados={plantillasFiltradas}
                                        claveDe={(pl) => pl.id}
                                        textoDe={(pl) => pl.nombre}
                                        onElegir={(pl) => {
                                            aplicarPlantilla(pl);
                                            setPlantillaQuery(pl.nombre);
                                        }}
                                        sinResultados="Ninguna plantilla coincide."
                                        minCaracteres={1}
                                        claseLista="max-h-72"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="border-b px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "var(--border-default)" }}>
                                Estudios Anteriores
                            </p>
                            {estudiosAnteriores.length === 0 ? (
                                <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">Este paciente no tiene estudios anteriores firmados.</p>
                            ) : (
                                <Table>
                                    <TableBody>
                                        {estudiosAnteriores.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="py-2.5">
                                                    <p className="text-sm font-bold">{e.orden.consecutivo || e.orden.id}</p>
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {e.orden.fechaIngreso}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {e.orden.tipoEstudio?.nombreTipoEstudio ?? ""}
                                                    {e.descripcionMacroscopica ? <span className="block text-muted-foreground">{e.descripcionMacroscopica}</span> : null}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" title="Vista previa del informe" onClick={() => verAnterior(e)}>
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

                    <div className="col-span-10 space-y-4 lg:col-span-7">
                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium">Consecutivo</label>
                                    <Input value={ordenActiva.consecutivo} disabled />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium">Estudio</label>
                                    <Input value={ordenActiva.tipoEstudio?.nombreTipoEstudio ?? ""} disabled />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-medium">Fecha ingreso</label>
                                    <Input value={ordenActiva.fechaIngreso} disabled />
                                </div>
                                <Campo label="Fecha salida" nombre="fechaSalida" error={v.error("fechaSalida")}>
                                    <Input type="date" value={form.fechaSalida} onChange={(e) => set("fechaSalida", e.target.value)} />
                                </Campo>
                                <Campo label="Material enviado o espécimen" nombre="tipoMuestra" error={v.error("tipoMuestra")} requerido className="col-span-2 md:col-span-4">
                                    <EspecimenPicker
                                        valor={form.tipoMuestra}
                                        onElegir={(e) => {
                                            setForm((f) => ({ ...f, idEspecimen: e.id, tipoMuestra: e.nombre }));
                                            setCambios(true);
                                        }}
                                    />
                                </Campo>
                                <Campo label="Sitio lesión" nombre="sitioLesion" error={v.error("sitioLesion")} className="col-span-2">
                                    <Input value={form.sitioLesion} maxLength={50} onChange={(e) => set("sitioLesion", e.target.value)} />
                                </Campo>
                                <Campo label="Solicitado por (Remitente)" nombre="solicitado" error={v.error("solicitado")} className="col-span-2">
                                    <Input value={form.solicitado} maxLength={50} placeholder="Dr: " onChange={(e) => set("solicitado", e.target.value)} />
                                </Campo>
                                <Campo label="Impresión diagnóstica" nombre="impresionDiagnostica" error={v.error("impresionDiagnostica")} requerido={firmar} className="col-span-2 md:col-span-3">
                                    <Input value={form.impresionDiagnostica} onChange={(e) => set("impresionDiagnostica", e.target.value.toUpperCase())} />
                                </Campo>
                                <Campo label="Resultado" nombre="resultado" error={v.error("resultado")} requerido={firmar}>
                                    <Select
                                        className="w-full"
                                        selectClassName={`font-semibold ${form.resultado === "POSITIVO" ? "text-red-700" : ""}`}
                                        value={form.resultado}
                                        onChange={(e) => set("resultado", e.target.value)}
                                    >
                                        <option value="">—</option>
                                        <option value="NEGATIVO">NEGATIVO</option>
                                        <option value="POSITIVO">POSITIVO</option>
                                    </Select>
                                </Campo>
                            </div>

                            <Campo label="Diagnóstico CIE10" nombre="codigoDiagnostico" error={v.error("codigoDiagnostico")} requerido={firmar} className="relative mt-3">
                                <Buscador
                                    placeholder="Buscar por código o nombre…"
                                    texto={cie10Query}
                                    onTexto={(t) => {
                                        setCie10Query(t);
                                        // Al editar el texto, el diagnóstico elegido deja de estar seleccionado.
                                        if (form.codigoDiagnostico) {
                                            set("codigoDiagnostico", "");
                                            setCie10Nombre("");
                                        }
                                    }}
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
                                {form.codigoDiagnostico && (
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                                        {form.codigoDiagnostico} — {cie10Nombre || "(sin nombre)"}
                                    </p>
                                )}
                            </Campo>

                            <Campo label="Descripción del estudio patológico" nombre="descripcion" error={v.error("descripcion")} requerido={firmar} className="mt-3">
                                <RichTextEditor key={editorKey.current} rows={16} value={form.descripcion} onChange={(html) => set("descripcion", html)} />
                            </Campo>

                            <div className="mt-3 space-y-1.5">
                                <label className="text-[13px] font-medium">Observaciones</label>
                                <Textarea rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
                            </div>

                            <div className="mt-3">
                                <ResumenErrores mensaje={v.resumen} />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <label className="mr-auto flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium">
                                    <input
                                        type="checkbox"
                                        checked={firmar}
                                        onChange={(e) => {
                                            setFirmar(e.target.checked);
                                            // Sin firma ya no aplican los campos obligatorios de firma.
                                            if (!e.target.checked) {
                                                exigirFirma.current = false;
                                                v.reiniciar();
                                            }
                                        }}
                                    />
                                    Firmar estudio (procesado)
                                </label>
                                {hasPermission("adjuntarImagenes") && (
                                    <Button type="button" variant="outline" onClick={() => setDialogo("imagenes")}>
                                        <Camera size={14} /> Imágenes
                                    </Button>
                                )}
                                {hasPermission("adjuntos") && (
                                    <Button type="button" variant="outline" onClick={() => setDialogo("adjuntos")}>
                                        <Paperclip size={14} /> Adjuntos
                                    </Button>
                                )}
                                <Button type="button" variant="outline" onClick={vistaPreliminar} disabled={generandoPdf || guardando}>
                                    {generandoPdf ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                                    Vista preliminar
                                </Button>
                                <Button onClick={onGuardar} disabled={guardando}>
                                    {guardando ? <Loader2 className="animate-spin" size={14} /> : firmar ? <PenLine size={14} /> : <Save size={14} />}
                                    {firmar ? "Guardar y firmar" : "Guardar"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <ImagenesDialog
                    open={dialogo === "imagenes"}
                    onOpenChange={(o) => !o && setDialogo(null)}
                    idOrden={ordenActiva.id}
                    titulo={`${ordenActiva.consecutivo} · ${nombrePaciente(p)}`}
                />
                <AdjuntosDialog
                    open={dialogo === "adjuntos"}
                    onOpenChange={(o) => !o && setDialogo(null)}
                    idOrden={ordenActiva.id}
                    titulo={`${ordenActiva.consecutivo} · ${nombrePaciente(p)}`}
                />
                {dialogos}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border px-6 py-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Patologías</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Pacientes por atender · {pendientes.length} órdenes sin firmar
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => cargarPendientes(searchTerm, idSede)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && <p className="rounded-md bg-red-50 px-4 py-2.5 text-[13px] text-red-700">{error}</p>}

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Buscar por orden, nombre o identificación..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
                {sedes.length > 1 && (
                    <Select value={idSede} onChange={(e) => setIdSede(e.target.value)}>
                        <option value="">Todas las sedes</option>
                        {sedes.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nombre}
                            </option>
                        ))}
                    </Select>
                )}
            </div>

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" />
                                    Orden
                                </span>
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    Paciente
                                </span>
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <TestTube2 className="h-3.5 w-3.5" />
                                    Espécimen / Estudio
                                </span>
                            </TableHead>
                            <TableHead>Sede</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-8 text-center text-[13px] text-muted-foreground">
                                    No hay órdenes pendientes de informe.
                                </TableCell>
                            </TableRow>
                        )}
                        {pendientes.map((orden) => {
                            const p = orden.paciente;
                            return (
                                <TableRow key={orden.id} className="cursor-pointer align-top hover:bg-muted/40" onDoubleClick={() => abrirOrden(orden)}>
                                    <TableCell className="py-3">
                                        <p className="font-bold">{orden.consecutivo || orden.id}</p>
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
                                                {p.identificacion} · {p.sexo} · {calcularEdad(p.fechaNacimiento)} años
                                                {p.telefono ? ` · ${p.telefono}` : ""}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[320px] py-3 text-sm">
                                        {orden.especimen?.nombre ?? "—"}
                                        {orden.tipoEstudio?.nombreTipoEstudio ? <span className="block text-xs text-muted-foreground">{orden.tipoEstudio.nombreTipoEstudio}</span> : null}
                                    </TableCell>
                                    <TableCell className="py-3 text-xs">{orden.sede?.nombre ?? ""}</TableCell>
                                    <TableCell className="py-3 text-center">
                                        {orden.tieneInforme ? (
                                            <Badge className="border-blue-200 bg-blue-100 text-blue-700 hover:bg-blue-100/80">Con informe</Badge>
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
            {dialogos}
        </div>
    );
}
