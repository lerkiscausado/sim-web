"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, Loader2, Microscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, Save, PenLine, Camera, BookOpenText, Paperclip, Check, CircleAlert, ExternalLink, CloudCheck } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion, type Regla } from "@/lib/validacion";
import { abrirPdf, pedirArchivo } from "@/lib/descargas";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, htmlToPlainText } from "@/components/ui/rich-text-editor";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ImagenesDialog } from "@/components/ordenes/ImagenesDialog";
import { AdjuntosDialog } from "@/components/ordenes/AdjuntosDialog";
import type { OrdenPendiente, PlantillaPatologia, DiagnosticoCie10, InformePatologia, UpsertPatologiaPayload, EstudioAnterior } from "./types";
import { nombrePaciente, calcularEdad } from "./types";
import { hoyISO, diasHabilesDesde, PLAZO_DIAS_HABILES } from "@/lib/fechas";
import { useResumen } from "@/lib/resumen";
import { Etiqueta, Panel, PanelHeader, Pildora } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { useFeedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select";
import { Buscador } from "@/components/ui/buscador";
import { useAvisoSalida } from "@/lib/useAvisoSalida";
import { PacienteCard, EspecimenPicker } from "./componentes";
import { usePaginacionLocal } from "@/lib/useTabla";
import { PaginationControls } from "@/components/ui/pagination-controls";

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
    const [confirmarFirma, setConfirmarFirma] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [errorDlg, setErrorDlg] = useState<{ titulo: string; mensaje?: string; detalles?: string[] } | null>(null);
    const [informeGuardado, setInformeGuardado] = useState<InformePatologia | null>(null);
    const [plantillaQuery, setPlantillaQuery] = useState("");
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [dialogo, setDialogo] = useState<"imagenes" | "adjuntos" | null>(null);
    const tablaPendientes = usePaginacionLocal(pendientes, "pendientes-patologias");
    const { refrescar: refrescarResumen } = useResumen();
    /** Vista previa del informe (PDF real del servidor) dentro de la página. */
    const [previa, setPrevia] = useState<{ url: string } | null>(null);
    const [generandoPrevia, setGenerandoPrevia] = useState(false);
    const ordenDeUrl = useRef<number | null>(null);
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
        setPrevia(null);
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

    /** Guarda sin firmar: solo exige el espécimen. */
    async function guardarBorrador() {
        exigirFirma.current = false;
        if (await guardar()) avisar.exito("Estudio guardado.");
    }

    /** Guarda exigiendo los campos de firma (como bbiGuardar con chkProcesado) y pide confirmar la firma. */
    async function guardarYFirmar() {
        exigirFirma.current = true;
        if (await guardar()) setConfirmarFirma(true);
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
            refrescarResumen();
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

    /** Genera el PDF con el formato de la sede y lo muestra en el panel de vista previa. */
    async function generarPrevia() {
        if (!ordenActiva) return;
        if (cambios || !informeGuardado) {
            exigirFirma.current = false;
            const ok = await guardar();
            if (!ok) return;
        }
        setGenerandoPrevia(true);
        try {
            const { blob } = await pedirArchivo(`/atenciones/patologia/orden/${ordenActiva.id}/pdf?variante=final`);
            const url = URL.createObjectURL(blob);
            setPrevia((ant) => {
                if (ant) URL.revokeObjectURL(ant.url);
                return { url };
            });
        } catch (err) {
            setErrorDlg({ titulo: "No se pudo generar la vista previa", mensaje: err instanceof ApiError ? err.message : "Error" });
        } finally {
            setGenerandoPrevia(false);
        }
    }

    useEffect(() => () => {
        if (previa) URL.revokeObjectURL(previa.url);
    }, [previa]);

    // Abre directamente la orden indicada en la URL (/atenciones/patologias?orden=123), p. ej. desde el Inicio.
    useEffect(() => {
        if (ordenDeUrl.current === null) {
            ordenDeUrl.current = Number(new URLSearchParams(window.location.search).get("orden")) || 0;
        }
        if (!ordenDeUrl.current || loading || vista !== "listado") return;
        const o = pendientes.find((x) => x.id === ordenDeUrl.current);
        ordenDeUrl.current = 0;
        window.history.replaceState(null, "", window.location.pathname);
        if (o) abrirOrden(o);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al terminar la primera carga
    }, [loading, pendientes]);

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
        const requisitos: { texto: string; ok: boolean; valor?: string }[] = [
            { texto: "Espécimen", ok: !!form.tipoMuestra.trim(), valor: form.tipoMuestra.trim() || undefined },
            { texto: "Impresión diagnóstica", ok: !!form.impresionDiagnostica.trim() },
            { texto: "Resultado", ok: !!form.resultado, valor: form.resultado || undefined },
            { texto: "Diagnóstico CIE10", ok: !!form.codigoDiagnostico.trim(), valor: form.codigoDiagnostico.trim() || undefined },
            { texto: "Descripción del estudio", ok: !!htmlToPlainText(form.descripcion).trim() },
        ];
        const completos = requisitos.filter((r) => r.ok).length;
        const dias = diasHabilesDesde(ordenActiva.fechaIngreso);
        return (
            <div className="space-y-4">
                <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
                    <div>
                        <p className="eyebrow">Informe de patología</p>
                        <p className="dato-mono mt-0.5 text-[20px] font-semibold leading-tight" style={{ color: "var(--ink-primary)" }}>
                            {ordenActiva.consecutivo || ordenActiva.id}
                        </p>
                    </div>
                    <span className="hidden h-10 w-px md:block" style={{ background: "var(--border-default)" }} />
                    <DatoCaso etiqueta="Paciente" valor={nombrePaciente(p)} />
                    {p && <DatoCaso etiqueta="Identificación" valor={`${p.idTipoIdentificacion} ${p.identificacion}`} mono />}
                    {p && <DatoCaso etiqueta="Edad · sexo" valor={`${calcularEdad(p.fechaNacimiento)} años · ${p.sexo}`} />}
                    <DatoCaso etiqueta="Estudio" valor={ordenActiva.tipoEstudio?.nombreTipoEstudio ?? "—"} />
                    {ordenActiva.sede && <DatoCaso etiqueta="Sede" valor={ordenActiva.sede.nombre} />}
                    <DatoCaso
                        etiqueta="Ingreso"
                        valor={
                            <>
                                <span className="dato-mono">{ordenActiva.fechaIngreso}</span>{" "}
                                <span style={{ color: dias > PLAZO_DIAS_HABILES ? "var(--clinical-600)" : "var(--ink-tertiary)", fontWeight: dias > PLAZO_DIAS_HABILES ? 600 : 400 }}>
                                    ({dias} {dias === 1 ? "día hábil" : "días hábiles"})
                                </span>
                            </>
                        }
                    />
                    <div className="ml-auto flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: cambios ? "var(--status-warning)" : "var(--ink-tertiary)" }} aria-live="polite">
                            {cambios ? <CircleAlert size={14} /> : <CloudCheck size={14} />}
                            {cambios ? "Cambios sin guardar" : informeGuardado ? "Guardado" : "Sin informe aún"}
                        </span>
                        <Button variant="outline" size="sm" onClick={volverAlListado}>
                            <ArrowLeft size={14} />
                            Pacientes por atender
                        </Button>
                    </div>
                </Panel>

                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <Panel>
                        <PanelHeader titulo="Informe" icono={<Microscope size={15} style={{ color: "var(--ink-tertiary)" }} />}>
                            {hasPermission("adjuntarImagenes") && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDialogo("imagenes")}>
                                    <Camera size={14} /> Imágenes
                                </Button>
                            )}
                            {hasPermission("adjuntos") && (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setDialogo("adjuntos")}>
                                    <Paperclip size={14} /> Adjuntos
                                </Button>
                            )}
                        </PanelHeader>
                        <div className="space-y-4 p-5">
                            {plantillas.length > 0 && (
                                <div className="flex flex-wrap items-center gap-3 rounded-[7px] border border-dashed px-3.5 py-3" style={{ borderColor: "var(--border-strong)", background: "#fbfaf7" }}>
                                    <BookOpenText size={17} style={{ color: "var(--ink-brand)" }} />
                                    <div className="min-w-[160px] flex-1">
                                        <p className="text-[13px] font-medium">Plantilla de patología</p>
                                        <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                            Reemplaza la descripción del estudio. Después puede editarla libremente.
                                        </p>
                                    </div>
                                    <div className="relative w-full sm:w-72">
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

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <Campo label="Material enviado o espécimen" nombre="tipoMuestra" error={v.error("tipoMuestra")} requerido className="col-span-2 md:col-span-3">
                                    <EspecimenPicker
                                        valor={form.tipoMuestra}
                                        onElegir={(e) => {
                                            setForm((f) => ({ ...f, idEspecimen: e.id, tipoMuestra: e.nombre }));
                                            setCambios(true);
                                        }}
                                    />
                                </Campo>
                                <Campo label="Fecha salida" nombre="fechaSalida" error={v.error("fechaSalida")} className="col-span-2 md:col-span-1">
                                    <Input type="date" value={form.fechaSalida} onChange={(e) => set("fechaSalida", e.target.value)} />
                                </Campo>
                                <Campo label="Sitio lesión" nombre="sitioLesion" error={v.error("sitioLesion")} className="col-span-2">
                                    <Input value={form.sitioLesion} maxLength={50} onChange={(e) => set("sitioLesion", e.target.value)} />
                                </Campo>
                                <Campo label="Solicitado por (Remitente)" nombre="solicitado" error={v.error("solicitado")} className="col-span-2">
                                    <Input value={form.solicitado} maxLength={50} placeholder="Dr: " onChange={(e) => set("solicitado", e.target.value)} />
                                </Campo>
                            </div>

                            <Campo label="Impresión diagnóstica" nombre="impresionDiagnostica" error={v.error("impresionDiagnostica")} requerido>
                                <Input value={form.impresionDiagnostica} onChange={(e) => set("impresionDiagnostica", e.target.value.toUpperCase())} />
                            </Campo>

                            <Campo label="Resultado" nombre="resultado" error={v.error("resultado")} requerido>
                                <div role="radiogroup" aria-label="Resultado" className="resultado-seg grid grid-cols-2 gap-2">
                                    {(
                                        [
                                            { valor: "NEGATIVO", texto: "NEGATIVO", color: "var(--status-success)", fondo: "var(--status-success-bg)" },
                                            { valor: "POSITIVO", texto: "POSITIVO", color: "var(--clinical-600)", fondo: "var(--clinical-50)" },
                                        ] as const
                                    ).map((o) => {
                                        const activo = form.resultado === o.valor;
                                        return (
                                            <button
                                                key={o.valor}
                                                type="button"
                                                role="radio"
                                                aria-checked={activo}
                                                onClick={() => set("resultado", activo ? "" : o.valor)}
                                                className="flex h-10 items-center justify-center gap-2 rounded-[5px] border text-[12.5px] font-semibold tracking-[0.04em] transition-colors"
                                                style={{
                                                    borderColor: activo ? o.color : "var(--border-default)",
                                                    background: activo ? o.fondo : "var(--surface-raised)",
                                                    color: activo ? o.color : "var(--ink-secondary)",
                                                }}
                                            >
                                                {activo && <Check size={14} strokeWidth={3} />}
                                                {o.texto}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Campo>

                            <Campo label="Diagnóstico CIE10" nombre="codigoDiagnostico" error={v.error("codigoDiagnostico")} requerido className="relative">
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
                                            <span className="dato-mono font-semibold">{d.codigoDiagnostico}</span> — {d.nombreDiagnostico}
                                        </>
                                    )}
                                    sinResultados="No se encontraron diagnósticos."
                                />
                                {form.codigoDiagnostico && (
                                    <p className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                                        <Etiqueta className="dato-mono font-semibold" style={{ color: "var(--ink-primary)" }}>
                                            {form.codigoDiagnostico}
                                        </Etiqueta>
                                        {cie10Nombre || "(sin nombre)"}
                                    </p>
                                )}
                            </Campo>

                            <Campo label="Descripción del estudio patológico" nombre="descripcion" error={v.error("descripcion")} requerido>
                                <RichTextEditor key={editorKey.current} rows={16} value={form.descripcion} onChange={(html) => set("descripcion", html)} />
                            </Campo>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium">Observaciones</label>
                                <Textarea rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
                            </div>

                            <ResumenErrores mensaje={v.resumen} />
                        </div>
                    </Panel>

                    <aside className="flex flex-col gap-4 xl:sticky xl:top-0">
                        <Panel>
                            <PanelHeader titulo="Antes de firmar">
                                <span className="dato-mono">
                                    {completos} de {requisitos.length}
                                </span>
                            </PanelHeader>
                            <ul className="py-1.5">
                                {requisitos.map((r) => (
                                    <li key={r.texto} className="flex items-center gap-2.5 px-4 py-1.5 text-[12.5px]">
                                        <span
                                            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                background: r.ok ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                                                color: r.ok ? "var(--status-success)" : "var(--status-warning)",
                                            }}
                                            aria-hidden
                                        >
                                            {r.ok ? <Check size={11} strokeWidth={3} /> : <CircleAlert size={11} strokeWidth={2.5} />}
                                        </span>
                                        <span style={{ color: r.ok ? "var(--ink-primary)" : "var(--ink-secondary)" }}>{r.texto}</span>
                                        <span className="sr-only">{r.ok ? "completo" : "pendiente"}</span>
                                        {r.valor && (
                                            <span className="ml-auto max-w-[150px] truncate text-[11.5px]" style={{ color: "var(--ink-tertiary)" }} title={r.valor}>
                                                {r.valor}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <div className="space-y-2.5 border-t px-4 py-3.5" style={{ borderColor: "var(--border-subtle)" }}>
                                <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                    Al firmar, el estudio queda a su nombre, ya no se puede modificar y la orden pasa a ATENDIDO.
                                </p>
                                <Button className="h-10 w-full text-[13px]" onClick={guardarYFirmar} disabled={guardando}>
                                    {guardando ? <Loader2 className="animate-spin" size={15} /> : <PenLine size={15} />}
                                    Guardar y firmar
                                </Button>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" onClick={guardarBorrador} disabled={guardando}>
                                        <Save size={14} /> Guardar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={vistaPreliminar} disabled={generandoPdf || guardando} title="Abre el informe en una pestaña nueva">
                                        {generandoPdf ? <Loader2 className="animate-spin" size={14} /> : <ExternalLink size={14} />}
                                        Abrir PDF
                                    </Button>
                                </div>
                            </div>
                        </Panel>

                        <Panel>
                            <PanelHeader titulo="Vista previa" etiqueta={ordenActiva.sede ? <Etiqueta>Formato {ordenActiva.sede.nombre}</Etiqueta> : undefined}>
                                {previa && (
                                    <Button variant="ghost" size="icon-sm" title="Actualizar vista previa" aria-label="Actualizar vista previa" onClick={generarPrevia} disabled={generandoPrevia || guardando}>
                                        <RefreshCw size={14} className={generandoPrevia ? "animate-spin" : ""} />
                                    </Button>
                                )}
                            </PanelHeader>
                            <div className="p-3" style={{ background: "#e9ebee" }}>
                                {previa ? (
                                    <div className="relative">
                                        <iframe title="Vista previa del informe" src={`${previa.url}#toolbar=0&navpanes=0&view=FitH`} className="aspect-[8.5/11] w-full rounded-sm bg-white shadow-sm" />
                                        {cambios && (
                                            <button
                                                type="button"
                                                onClick={generarPrevia}
                                                className="absolute inset-x-3 top-3 rounded-md px-3 py-2 text-[12px] font-medium shadow"
                                                style={{ background: "var(--status-warning-bg)", color: "var(--status-warning)" }}
                                            >
                                                Hay cambios: guardar y actualizar la vista previa
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex aspect-[8.5/11] flex-col items-center justify-center gap-3 rounded-sm bg-white px-6 text-center shadow-sm">
                                        <FileDown size={22} style={{ color: "var(--ink-muted)" }} />
                                        <p className="text-[12.5px]" style={{ color: "var(--ink-secondary)" }}>
                                            Vea el informe tal como saldrá impreso, con el formato de la sede de la orden.
                                        </p>
                                        <Button variant="outline" size="sm" onClick={generarPrevia} disabled={generandoPrevia || guardando}>
                                            {generandoPrevia ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />}
                                            Guardar y ver vista previa
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Panel>

                        <PacienteCard p={p} />

                        <Panel>
                            <PanelHeader titulo="Estudios anteriores" etiqueta={estudiosAnteriores.length ? <Etiqueta>{estudiosAnteriores.length}</Etiqueta> : undefined} />
                            {estudiosAnteriores.length === 0 ? (
                                <p className="px-4 py-5 text-center text-[12.5px] text-muted-foreground">Este paciente no tiene estudios anteriores firmados.</p>
                            ) : (
                                <ul>
                                    {estudiosAnteriores.map((e) => (
                                        <li key={e.id} className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
                                            <div className="min-w-0 flex-1">
                                                <p className="dato-mono text-[12.5px] font-semibold">{e.orden.consecutivo || e.orden.id}</p>
                                                <p className="flex items-center gap-1 text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                    <CalendarDays className="h-3 w-3" />
                                                    {e.orden.fechaIngreso} · {e.orden.tipoEstudio?.nombreTipoEstudio ?? ""}
                                                </p>
                                                {e.descripcionMacroscopica && <p className="truncate text-[12px]">{e.descripcionMacroscopica}</p>}
                                            </div>
                                            <Button variant="ghost" size="icon-sm" title="Ver informe" aria-label={`Ver informe ${e.orden.consecutivo}`} onClick={() => verAnterior(e)}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </aside>
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
            <div className="encabezado-modulo flex flex-wrap items-end justify-between gap-3">
                <div>
                    <span className="label-clinical inline-block" style={{ color: "var(--ink-brand)" }}>
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Patologías</h1>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Pacientes por atender · {pendientes.length} órdenes sin firmar
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => cargarPendientes(searchTerm, idSede)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && (
                <p className="rounded-md px-4 py-2.5 text-[13px]" style={{ background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>
                    {error}
                </p>
            )}

            <Panel>
                <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="relative min-w-[240px] flex-1 sm:max-w-md">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-tertiary)" }} />
                        <Input
                            placeholder="Buscar por orden, nombre o identificación..."
                            aria-label="Buscar pacientes por atender"
                            className="h-8 pl-8 text-[13px]"
                            style={{ background: "var(--surface-inset)" }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {loading && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                    {sedes.length > 1 && (
                        <Select selectClassName="h-8 text-[12.5px]" value={idSede} onChange={(e) => setIdSede(e.target.value)} aria-label="Sede">
                            <option value="">Todas las sedes</option>
                            {sedes.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </Select>
                    )}
                    <span className="ml-auto text-[12px]" style={{ color: "var(--ink-tertiary)" }}>
                        Doble clic en una fila para informar
                    </span>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <Hash className="h-3 w-3" />
                                    Orden
                                </span>
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <User className="h-3 w-3" />
                                    Paciente
                                </span>
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <TestTube2 className="h-3 w-3" />
                                    Espécimen / Estudio
                                </span>
                            </TableHead>
                            <TableHead>Sede</TableHead>
                            <TableHead className="text-right" title="Días hábiles desde el ingreso">
                                Espera
                            </TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">
                                <span className="sr-only">Acción</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-[13px] text-muted-foreground">
                                    No hay órdenes pendientes de informe.
                                </TableCell>
                            </TableRow>
                        )}
                        {tablaPendientes.visibles.map((orden) => {
                            const p = orden.paciente;
                            const dias = diasHabilesDesde(orden.fechaIngreso);
                            const vencido = dias > PLAZO_DIAS_HABILES;
                            return (
                                <TableRow key={orden.id} className="cursor-pointer" onDoubleClick={() => abrirOrden(orden)}>
                                    <TableCell>
                                        <p className="dato-mono text-[12.5px] font-semibold">{orden.consecutivo || orden.id}</p>
                                        <p className="dato-mono flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
                                            <CalendarDays className="h-3 w-3" />
                                            {orden.fechaIngreso}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium" style={{ color: "var(--ink-primary)" }}>
                                            {nombrePaciente(p).toUpperCase()}
                                        </p>
                                        {p && (
                                            <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                <span className="dato-mono">
                                                    {p.idTipoIdentificacion}
                                                    {p.identificacion}
                                                </span>{" "}
                                                · {p.sexo} · {calcularEdad(p.fechaNacimiento)} años
                                                {p.telefono ? ` · ${p.telefono}` : ""}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[320px]">
                                        <p className="truncate">{orden.especimen?.nombre ?? "—"}</p>
                                        {orden.tipoEstudio?.nombreTipoEstudio ? (
                                            <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                {orden.tipoEstudio.nombreTipoEstudio}
                                            </p>
                                        ) : null}
                                    </TableCell>
                                    <TableCell>{orden.sede?.nombre ? <Etiqueta>{orden.sede.nombre}</Etiqueta> : ""}</TableCell>
                                    <TableCell
                                        className={cn("dato-mono text-right text-[12px]", vencido && "font-semibold")}
                                        style={{ color: vencido ? "var(--clinical-600)" : "var(--ink-secondary)" }}
                                        title={vencido ? `Supera ${PLAZO_DIAS_HABILES} días hábiles` : undefined}
                                    >
                                        {dias} {dias === 1 ? "día" : "días"}
                                    </TableCell>
                                    <TableCell>
                                        {orden.tieneInforme ? <Pildora tono="info">Con informe</Pildora> : <Pildora tono="aviso">Pendiente</Pildora>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant={orden.tieneInforme ? "default" : "outline"} onClick={() => abrirOrden(orden)}>
                                            <Microscope size={14} />
                                            {orden.tieneInforme ? "Revisar y firmar" : "Informar"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <PaginationControls className="border-t px-3 py-2.5" {...tablaPendientes.paginacion} />
            </Panel>
            {dialogos}
        </div>
    );
}

/** Dato del encabezado del caso: etiqueta pequeña en mayúsculas y valor. */
function DatoCaso({ etiqueta, valor, mono }: { etiqueta: string; valor: React.ReactNode; mono?: boolean }) {
    return (
        <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-tertiary)" }}>
                {etiqueta}
            </p>
            <p className={cn("mt-0.5 truncate text-[13px] font-medium", mono && "dato-mono")} style={{ color: "var(--ink-primary)" }}>
                {valor}
            </p>
        </div>
    );
}
