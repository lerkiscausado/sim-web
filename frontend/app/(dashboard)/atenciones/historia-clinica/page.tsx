"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Stethoscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, Plus, Trash2, PenLine } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
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
} from "@/components/ui/dialog";
import type {
    OrdenPendiente,
    HistoriaClinicaData,
    ItemDiagnostico,
    ItemMedicamento,
    ItemCups,
    ItemRxs,
    EstudioAnterior,
    PacienteHistoria,
} from "./types";
import { nombrePaciente, calcularEdad } from "./types";

const FORM_INICIAL: HistoriaClinicaData = {
    idOrden: 0,
    idDetalleOrden: 0,
    responsables: "",
    motivoConsulta: "",
    consultaControl: "",
    enfermedadActual: "",
    examenFisico: "",
    peso: undefined,
    talla: undefined,
    tensionArterial: "",
    frecuenciaCardiaca: "",
    frecuenciaRespiratoria: "",
    temperatura: "",
    diagnostico: "",
    planSeguir: "",
    formulacion: "",
    laboratorios: "",
    otrosEstudios: "",
    recomendaciones: "",
};

function PacienteCard({ p }: { p?: PacienteHistoria }) {
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

export default function HistoriaClinicaPage() {
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState<HistoriaClinicaData>(FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [firmando, setFirmando] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardadoOk, setGuardadoOk] = useState(false);
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);

    // ---- Diagnósticos ----
    const [diagnosticos, setDiagnosticos] = useState<ItemDiagnostico[]>([]);
    const [dxQuery, setDxQuery] = useState("");
    const [dxResultados, setDxResultados] = useState<{ codigoDiagnostico: string; nombreDiagnostico: string | null }[]>([]);
    const [dxElegido, setDxElegido] = useState<{ codigoDiagnostico: string; nombreDiagnostico: string | null } | null>(null);
    const [dxDescripcion, setDxDescripcion] = useState("");

    // ---- Medicamentos ----
    const [medicamentos, setMedicamentos] = useState<ItemMedicamento[]>([]);
    const [medQuery, setMedQuery] = useState("");
    const [medResultados, setMedResultados] = useState<{ id: number; nombre: string }[]>([]);
    const [medElegido, setMedElegido] = useState<{ id: number; nombre: string } | null>(null);
    const [viasAdministracion, setViasAdministracion] = useState<{ id: number; nombre: string }[]>([]);
    const [medForm, setMedForm] = useState({ idViaAdministracion: "", dosis: "", cantidad: "", descripcion: "" });

    // ---- Laboratorios (CUPS) ----
    const [laboratorios, setLaboratorios] = useState<ItemCups[]>([]);
    const [labQuery, setLabQuery] = useState("");
    const [labResultados, setLabResultados] = useState<{ codigoCups: string; nombreCups: string }[]>([]);
    const [labElegido, setLabElegido] = useState<{ codigoCups: string; nombreCups: string } | null>(null);
    const [labDescripcion, setLabDescripcion] = useState("");

    // ---- Procedimientos (CUPS) ----
    const [procedimientos, setProcedimientos] = useState<ItemCups[]>([]);
    const [procQuery, setProcQuery] = useState("");
    const [procResultados, setProcResultados] = useState<{ codigoCups: string; nombreCups: string }[]>([]);
    const [procElegido, setProcElegido] = useState<{ codigoCups: string; nombreCups: string } | null>(null);
    const [procDescripcion, setProcDescripcion] = useState("");

    // ---- Revisión por sistemas ----
    const [rxsList, setRxsList] = useState<ItemRxs[]>([]);
    const [rxsCatalogo, setRxsCatalogo] = useState<{ id: number; nombre: string }[]>([]);
    const [rxsForm, setRxsForm] = useState({ idRxs: "", descripcion: "" });

    const cargarPendientes = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const pend = await api.get<OrdenPendiente[]>(`/atenciones/historia-clinica/pendientes${qs}`);
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

    // Búsquedas con debounce para cada catálogo
    useEffect(() => {
        if (dxQuery.trim().length < 2) return setDxResultados([]);
        const t = setTimeout(async () => {
            try {
                setDxResultados(await api.get(`/catalogos/diagnosticos/search?q=${encodeURIComponent(dxQuery)}`));
            } catch {
                setDxResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [dxQuery]);

    useEffect(() => {
        if (medQuery.trim().length < 2) return setMedResultados([]);
        const t = setTimeout(async () => {
            try {
                setMedResultados(await api.get(`/catalogos/medicamentos/search?q=${encodeURIComponent(medQuery)}`));
            } catch {
                setMedResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [medQuery]);

    useEffect(() => {
        if (labQuery.trim().length < 2) return setLabResultados([]);
        const t = setTimeout(async () => {
            try {
                setLabResultados(await api.get(`/catalogos/cups/search?q=${encodeURIComponent(labQuery)}`));
            } catch {
                setLabResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [labQuery]);

    useEffect(() => {
        if (procQuery.trim().length < 2) return setProcResultados([]);
        const t = setTimeout(async () => {
            try {
                setProcResultados(await api.get(`/catalogos/cups/search?q=${encodeURIComponent(procQuery)}`));
            } catch {
                setProcResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [procQuery]);

    async function abrirOrden(orden: OrdenPendiente) {
        setOrdenActiva(orden);
        setFormError(null);
        setGuardadoOk(false);
        setForm({ ...FORM_INICIAL, idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden });
        setVista("informe");

        api
            .get<EstudioAnterior[]>(`/atenciones/historia-clinica/paciente/${orden.idUsuario}/estudios-anteriores`)
            .then(setEstudiosAnteriores)
            .catch(() => setEstudiosAnteriores([]));

        api.get<{ id: number; nombre: string }[]>(`/catalogos/lookup/via-administracion`).then(setViasAdministracion).catch(() => setViasAdministracion([]));
        api.get<{ id: number; nombre: string }[]>(`/catalogos/lookup/revision-sistemas`).then(setRxsCatalogo).catch(() => setRxsCatalogo([]));

        recargarListas(orden.idDetalleOrden);

        try {
            const existente = await api.get<HistoriaClinicaData | null>(
                `/atenciones/historia-clinica/detalle-orden/${orden.idDetalleOrden}`
            );
            if (existente) {
                setForm({ ...existente, idOrden: orden.idOrden, idDetalleOrden: orden.idDetalleOrden });
            }
        } catch {
            // sin historia previa todavía
        }
    }

    function recargarListas(idDetalleOrden: number) {
        api.get<ItemDiagnostico[]>(`/atenciones/historia-clinica/detalle-orden/${idDetalleOrden}/diagnosticos`).then(setDiagnosticos).catch(() => setDiagnosticos([]));
        api.get<ItemMedicamento[]>(`/atenciones/historia-clinica/detalle-orden/${idDetalleOrden}/medicamentos`).then(setMedicamentos).catch(() => setMedicamentos([]));
        api.get<ItemCups[]>(`/atenciones/historia-clinica/detalle-orden/${idDetalleOrden}/laboratorios`).then(setLaboratorios).catch(() => setLaboratorios([]));
        api.get<ItemCups[]>(`/atenciones/historia-clinica/detalle-orden/${idDetalleOrden}/procedimientos`).then(setProcedimientos).catch(() => setProcedimientos([]));
        api.get<ItemRxs[]>(`/atenciones/historia-clinica/detalle-orden/${idDetalleOrden}/rxs`).then(setRxsList).catch(() => setRxsList([]));
    }

    function volverAlListado() {
        setVista("listado");
        setOrdenActiva(null);
        cargarPendientes(searchTerm);
    }

    async function guardarInforme() {
        if (!ordenActiva) return;
        setFormError(null);
        setGuardadoOk(false);
        setGuardando(true);
        try {
            await api.post("/atenciones/historia-clinica", form);
            setGuardadoOk(true);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la historia clínica");
        } finally {
            setGuardando(false);
        }
    }

    async function firmarHistoria() {
        if (!ordenActiva) return;
        setFirmando(true);
        setFormError(null);
        try {
            await api.patch(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/firmar`);
            volverAlListado();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo firmar la historia");
        } finally {
            setFirmando(false);
        }
    }

    async function agregarDiagnostico() {
        if (!ordenActiva || !dxElegido) return;
        await api.post("/atenciones/historia-clinica/diagnosticos", {
            idOrden: ordenActiva.idOrden,
            idDetalleOrden: ordenActiva.idDetalleOrden,
            idDiagnostico: dxElegido.codigoDiagnostico,
            descripcion: dxDescripcion || undefined,
        });
        setDxQuery("");
        setDxElegido(null);
        setDxDescripcion("");
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function quitarDiagnostico(idDiagnostico: string) {
        if (!ordenActiva) return;
        await api.delete(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/orden/${ordenActiva.idOrden}/diagnosticos/${idDiagnostico}`);
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function agregarMedicamento() {
        if (!ordenActiva || !medElegido || !medForm.idViaAdministracion || !medForm.dosis || !medForm.cantidad || !medForm.descripcion) return;
        await api.post("/atenciones/historia-clinica/medicamentos", {
            idOrden: ordenActiva.idOrden,
            idDetalleOrden: ordenActiva.idDetalleOrden,
            idMedicamento: medElegido.id,
            idViaAdministracion: Number(medForm.idViaAdministracion),
            dosis: medForm.dosis,
            cantidad: medForm.cantidad,
            descripcion: medForm.descripcion,
        });
        setMedQuery("");
        setMedElegido(null);
        setMedForm({ idViaAdministracion: "", dosis: "", cantidad: "", descripcion: "" });
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function quitarMedicamento(idMedicamento: number) {
        if (!ordenActiva) return;
        await api.delete(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/orden/${ordenActiva.idOrden}/medicamentos/${idMedicamento}`);
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function agregarLaboratorio() {
        if (!ordenActiva || !labElegido) return;
        await api.post("/atenciones/historia-clinica/laboratorios", {
            idOrden: ordenActiva.idOrden,
            idDetalleOrden: ordenActiva.idDetalleOrden,
            codigoCups: labElegido.codigoCups,
            descripcion: labDescripcion || undefined,
        });
        setLabQuery("");
        setLabElegido(null);
        setLabDescripcion("");
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function quitarLaboratorio(codigoCups: string) {
        if (!ordenActiva) return;
        await api.delete(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/orden/${ordenActiva.idOrden}/laboratorios/${codigoCups}`);
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function agregarProcedimiento() {
        if (!ordenActiva || !procElegido || !procDescripcion) return;
        await api.post("/atenciones/historia-clinica/procedimientos", {
            idOrden: ordenActiva.idOrden,
            idDetalleOrden: ordenActiva.idDetalleOrden,
            codigoCups: procElegido.codigoCups,
            descripcion: procDescripcion,
        });
        setProcQuery("");
        setProcElegido(null);
        setProcDescripcion("");
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function quitarProcedimiento(codigoCups: string) {
        if (!ordenActiva) return;
        await api.delete(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/orden/${ordenActiva.idOrden}/procedimientos/${codigoCups}`);
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function agregarRxs() {
        if (!ordenActiva || !rxsForm.idRxs || !rxsForm.descripcion) return;
        await api.post("/atenciones/historia-clinica/rxs", {
            idOrden: ordenActiva.idOrden,
            idDetalleOrden: ordenActiva.idDetalleOrden,
            idRxs: Number(rxsForm.idRxs),
            descripcion: rxsForm.descripcion,
        });
        setRxsForm({ idRxs: "", descripcion: "" });
        recargarListas(ordenActiva.idDetalleOrden);
    }

    async function quitarRxs(idRxs: number) {
        if (!ordenActiva) return;
        await api.delete(`/atenciones/historia-clinica/detalle-orden/${ordenActiva.idDetalleOrden}/orden/${ordenActiva.idOrden}/rxs/${idRxs}`);
        recargarListas(ordenActiva.idDetalleOrden);
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
                            Atenciones · Historia Clínica
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>Historia Clínica — Orden {ordenActiva.consecutivo}</h1>
                        <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                            {ordenActiva.estudio} · Fecha de ingreso: {ordenActiva.fechaIngreso}
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
                                    Este paciente no tiene historias anteriores cerradas.
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
                                                    <p className="text-sm font-bold">{e.consecutivo}</p>
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
                    <div className="col-span-10 lg:col-span-7">
                        <Tabs defaultValue="motivo" className="w-full">
                            <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto overflow-y-hidden bg-transparent p-0">
                                <TabsTrigger value="motivo" className="shrink-0 whitespace-nowrap">Motivo de Consulta</TabsTrigger>
                                <TabsTrigger value="control" className="shrink-0 whitespace-nowrap">Consulta de Control</TabsTrigger>
                                <TabsTrigger value="enfermedad" className="shrink-0 whitespace-nowrap">Enfermedad Actual</TabsTrigger>
                                <TabsTrigger value="examen" className="shrink-0 whitespace-nowrap">Examen Físico</TabsTrigger>
                                <TabsTrigger value="rxs" className="shrink-0 whitespace-nowrap">Revisión por Sistemas</TabsTrigger>
                                <TabsTrigger value="diagnostico" className="shrink-0 whitespace-nowrap">Diagnóstico</TabsTrigger>
                                <TabsTrigger value="analisis" className="shrink-0 whitespace-nowrap">Análisis y Plan a Seguir</TabsTrigger>
                                <TabsTrigger value="formulacion" className="shrink-0 whitespace-nowrap">Formulación</TabsTrigger>
                                <TabsTrigger value="laboratorios" className="shrink-0 whitespace-nowrap">Laboratorios</TabsTrigger>
                                <TabsTrigger value="procedimientos" className="shrink-0 whitespace-nowrap">Procedimientos</TabsTrigger>
                            </TabsList>

                            <TabsContent value="motivo" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Responsables</label>
                                            <Input value={form.responsables ?? ""} onChange={(e) => setForm((f) => ({ ...f, responsables: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Motivo de Consulta</label>
                                            <Textarea rows={5} value={form.motivoConsulta ?? ""} onChange={(e) => setForm((f) => ({ ...f, motivoConsulta: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="control" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Consulta de Control o Evolución</label>
                                        <Textarea rows={6} value={form.consultaControl ?? ""} onChange={(e) => setForm((f) => ({ ...f, consultaControl: e.target.value }))} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="enfermedad" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Enfermedad Actual</label>
                                        <Textarea rows={6} value={form.enfermedadActual ?? ""} onChange={(e) => setForm((f) => ({ ...f, enfermedadActual: e.target.value }))} />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="examen" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Peso (kg)</label>
                                            <Input type="number" value={form.peso ?? ""} onChange={(e) => setForm((f) => ({ ...f, peso: Number(e.target.value) || undefined }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Talla (cm)</label>
                                            <Input type="number" value={form.talla ?? ""} onChange={(e) => setForm((f) => ({ ...f, talla: Number(e.target.value) || undefined }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Temperatura</label>
                                            <Input value={form.temperatura ?? ""} onChange={(e) => setForm((f) => ({ ...f, temperatura: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Tensión Arterial</label>
                                            <Input value={form.tensionArterial ?? ""} onChange={(e) => setForm((f) => ({ ...f, tensionArterial: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Frecuencia Cardíaca</label>
                                            <Input value={form.frecuenciaCardiaca ?? ""} onChange={(e) => setForm((f) => ({ ...f, frecuenciaCardiaca: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Frecuencia Respiratoria</label>
                                            <Input value={form.frecuenciaRespiratoria ?? ""} onChange={(e) => setForm((f) => ({ ...f, frecuenciaRespiratoria: e.target.value }))} />
                                        </div>
                                        <div className="col-span-3 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Descripción del Examen Físico</label>
                                            <Textarea rows={4} value={form.examenFisico ?? ""} onChange={(e) => setForm((f) => ({ ...f, examenFisico: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="rxs" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Sistema</label>
                                            <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={rxsForm.idRxs} onChange={(e) => setRxsForm((f) => ({ ...f, idRxs: e.target.value }))}>
                                                <option value="">Seleccionar…</option>
                                                {rxsCatalogo.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Hallazgo</label>
                                            <Input value={rxsForm.descripcion} onChange={(e) => setRxsForm((f) => ({ ...f, descripcion: e.target.value }))} />
                                        </div>
                                    </div>
                                    <Button size="sm" className="mt-3" onClick={agregarRxs} disabled={!rxsForm.idRxs || !rxsForm.descripcion}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Hallazgo
                                    </Button>
                                    {rxsList.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {rxsList.map((r) => (
                                                <div key={r.idRxs} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <span>{r.nombre}: {r.descripcion}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => quitarRxs(r.idRxs)}><Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="diagnostico" className="mt-3 space-y-4">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Diagnóstico</label>
                                        <Textarea rows={4} value={form.diagnostico ?? ""} onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <p className="mb-3 text-sm font-bold">Diagnósticos (CIE10)</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="relative col-span-2 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Buscar CIE10</label>
                                            <Input value={dxQuery} onChange={(e) => { setDxQuery(e.target.value); setDxElegido(null); }} placeholder="Código o nombre…" />
                                            {dxResultados.length > 0 && !dxElegido && (
                                                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md" style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}>
                                                    {dxResultados.map((d) => (
                                                        <button key={d.codigoDiagnostico} type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                            onClick={() => { setDxElegido(d); setDxQuery(`${d.codigoDiagnostico} — ${d.nombreDiagnostico}`); setDxResultados([]); }}>
                                                            <span className="font-semibold">{d.codigoDiagnostico}</span> — {d.nombreDiagnostico}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Nota (opcional)</label>
                                            <Input value={dxDescripcion} onChange={(e) => setDxDescripcion(e.target.value)} />
                                        </div>
                                    </div>
                                    <Button size="sm" className="mt-3" onClick={agregarDiagnostico} disabled={!dxElegido}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Diagnóstico
                                    </Button>
                                    {diagnosticos.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {diagnosticos.map((d) => (
                                                <div key={d.idDiagnostico} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <span><span className="font-semibold">{d.idDiagnostico}</span> — {d.nombre ?? "—"}{d.descripcion ? ` (${d.descripcion})` : ""}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => quitarDiagnostico(d.idDiagnostico)}><Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="analisis" className="mt-3">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Análisis y Plan a Seguir</label>
                                            <Textarea rows={5} value={form.planSeguir ?? ""} onChange={(e) => setForm((f) => ({ ...f, planSeguir: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Recomendaciones</label>
                                            <Textarea rows={3} value={form.recomendaciones ?? ""} onChange={(e) => setForm((f) => ({ ...f, recomendaciones: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="formulacion" className="mt-3 space-y-4">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Formulación</label>
                                        <Textarea rows={3} value={form.formulacion ?? ""} onChange={(e) => setForm((f) => ({ ...f, formulacion: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <p className="mb-3 text-sm font-bold">Medicamentos Formulados</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Medicamento</label>
                                            <Input value={medQuery} onChange={(e) => { setMedQuery(e.target.value); setMedElegido(null); }} placeholder="Buscar…" />
                                            {medResultados.length > 0 && !medElegido && (
                                                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md" style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}>
                                                    {medResultados.map((m) => (
                                                        <button key={m.id} type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                            onClick={() => { setMedElegido(m); setMedQuery(m.nombre); setMedResultados([]); }}>
                                                            {m.nombre}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Vía de Administración</label>
                                            <select className="h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={medForm.idViaAdministracion} onChange={(e) => setMedForm((f) => ({ ...f, idViaAdministracion: e.target.value }))}>
                                                <option value="">Seleccionar…</option>
                                                {viasAdministracion.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Dosis</label>
                                            <Input value={medForm.dosis} onChange={(e) => setMedForm((f) => ({ ...f, dosis: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Cantidad</label>
                                            <Input value={medForm.cantidad} onChange={(e) => setMedForm((f) => ({ ...f, cantidad: e.target.value }))} />
                                        </div>
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Indicaciones</label>
                                            <Input value={medForm.descripcion} onChange={(e) => setMedForm((f) => ({ ...f, descripcion: e.target.value }))} />
                                        </div>
                                    </div>
                                    <Button size="sm" className="mt-3" onClick={agregarMedicamento} disabled={!medElegido}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Medicamento
                                    </Button>
                                    {medicamentos.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {medicamentos.map((m) => (
                                                <div key={m.idMedicamento} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <span>{m.nombreMedicamento} — {m.dosis} x {m.cantidad} ({m.nombreViaAdministracion}) — {m.descripcion}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => quitarMedicamento(m.idMedicamento)}><Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="laboratorios" className="mt-3 space-y-4">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Laboratorios (texto libre)</label>
                                        <Textarea rows={2} value={form.laboratorios ?? ""} onChange={(e) => setForm((f) => ({ ...f, laboratorios: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <p className="mb-3 text-sm font-bold">Laboratorios Solicitados</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="relative col-span-2 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Examen (CUPS)</label>
                                            <Input value={labQuery} onChange={(e) => { setLabQuery(e.target.value); setLabElegido(null); }} placeholder="Buscar…" />
                                            {labResultados.length > 0 && !labElegido && (
                                                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md" style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}>
                                                    {labResultados.map((c) => (
                                                        <button key={c.codigoCups} type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                            onClick={() => { setLabElegido(c); setLabQuery(`${c.codigoCups} — ${c.nombreCups}`); setLabResultados([]); }}>
                                                            <span className="font-semibold">{c.codigoCups}</span> — {c.nombreCups}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Nota (opcional)</label>
                                            <Input value={labDescripcion} onChange={(e) => setLabDescripcion(e.target.value)} />
                                        </div>
                                    </div>
                                    <Button size="sm" className="mt-3" onClick={agregarLaboratorio} disabled={!labElegido}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Laboratorio
                                    </Button>
                                    {laboratorios.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {laboratorios.map((l) => (
                                                <div key={l.codigoCups} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <span><span className="font-semibold">{l.codigoCups}</span> — {l.nombre ?? "—"}{l.descripcion ? ` (${l.descripcion})` : ""}</span>
                                                    <Button variant="ghost" size="sm" onClick={() => quitarLaboratorio(l.codigoCups)}><Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="procedimientos" className="mt-3 space-y-4">
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Otros Estudios</label>
                                        <Textarea rows={2} value={form.otrosEstudios ?? ""} onChange={(e) => setForm((f) => ({ ...f, otrosEstudios: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                    <p className="mb-3 text-sm font-bold">Procedimientos</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="relative col-span-2 space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Procedimiento (CUPS)</label>
                                            <Input value={procQuery} onChange={(e) => { setProcQuery(e.target.value); setProcElegido(null); }} placeholder="Buscar…" />
                                            {procResultados.length > 0 && !procElegido && (
                                                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md" style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}>
                                                    {procResultados.map((c) => (
                                                        <button key={c.codigoCups} type="button" className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                            onClick={() => { setProcElegido(c); setProcQuery(`${c.codigoCups} — ${c.nombreCups}`); setProcResultados([]); }}>
                                                            <span className="font-semibold">{c.codigoCups}</span> — {c.nombreCups}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[12.5px] font-medium">Descripción</label>
                                            <Input value={procDescripcion} onChange={(e) => setProcDescripcion(e.target.value)} />
                                        </div>
                                    </div>
                                    <Button size="sm" className="mt-3" onClick={agregarProcedimiento} disabled={!procElegido || !procDescripcion}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Procedimiento
                                    </Button>
                                    {procedimientos.length > 0 && (
                                        <div className="mt-3 space-y-1.5">
                                            {procedimientos.map((p) => (
                                                <div key={p.codigoCups} className="flex items-center justify-between rounded-md border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--border-default)" }}>
                                                    <span><span className="font-semibold">{p.codigoCups}</span> — {p.nombre ?? "—"} ({p.descripcion})</span>
                                                    <Button variant="ghost" size="sm" onClick={() => quitarProcedimiento(p.codigoCups)}><Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Acciones globales: siempre visibles, sin importar la ficha activa */}
                        <div className="mt-4 rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            {formError && (
                                <p className="mb-3 rounded-md px-3 py-2 text-[12.5px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>
                                    {formError}
                                </p>
                            )}
                            {guardadoOk && (
                                <p className="mb-3 rounded-md bg-green-50 px-3 py-2 text-[12.5px] text-green-700">Historia guardada correctamente.</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={guardarInforme} disabled={guardando}>
                                    {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Historia
                                </Button>
                                <Button variant="outline" onClick={firmarHistoria} disabled={firmando}>
                                    {firmando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />}
                                    Firmar y Cerrar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={!!previewAnterior} onOpenChange={(open) => !open && setPreviewAnterior(null)}>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Orden {previewAnterior?.consecutivo}</DialogTitle>
                            <DialogDescription>{previewAnterior?.estudio}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-[11px] font-bold uppercase text-muted-foreground">Motivo de consulta</p>
                                <p>{previewAnterior?.motivoConsulta || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase text-muted-foreground">Diagnóstico</p>
                                <p>{previewAnterior?.diagnostico || "—"}</p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
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
                    <h1 style={{ color: "var(--ink-primary)" }}>Historia Clínica</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Tus pacientes pendientes de historia clínica
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
                                    No tienes pacientes pendientes de historia clínica.
                                </TableCell>
                            </TableRow>
                        )}
                        {pendientes.map((orden) => (
                            <TableRow key={orden.idDetalleOrden} className="align-top hover:bg-muted/40">
                                <TableCell className="py-3">
                                    <p className="font-bold">{orden.consecutivo}</p>
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
                                <TableCell className="py-3 text-sm">{orden.estudio}</TableCell>
                                <TableCell className="py-3 text-center">
                                    <Button size="sm" onClick={() => abrirOrden(orden)}>
                                        <Stethoscope size={14} />
                                        Atender
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
