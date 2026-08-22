"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2, Trash2, ClipboardPlus, ArrowLeft, ChevronLeft, ChevronRight, UserPlus, Printer, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api, apiFetchBlobUrl, ApiError } from "@/lib/api";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { PacienteFormDialog, type Paciente as PacienteCompleto, type TipoIdentificacion } from "@/components/pacientes/PacienteFormDialog";
import type {
    PacienteBusqueda,
    LookupItem,
    Contrato,
    Sede,
    Especimen,
    CupsItem,
    Orden,
    DetalleOrden,
    OrdenListado,
    OrdenListadoResult,
    Empleado,
} from "./types";
import { nombrePaciente, calcularEdad, sumarDiasHabiles, estadoTexto } from "./types";

const ESTADO_ESTILOS: Record<string, { bg: string; text: string; dot: string }> = {
    PENDIENTE: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    PROCESO: { bg: "#DBEAFE", text: "#1E40AF", dot: "#2563EB" },
    ATENDIDO: { bg: "#D1FAE5", text: "#065F46", dot: "#059669" },
    CANCELADO: { bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
    FACTURADO: { bg: "#EDE9FE", text: "#5B21B6", dot: "#7C3AED" },
};

function EstadoBadge({ estado }: { estado: string | string[] }) {
    const texto = estadoTexto(estado);
    const estilo = ESTADO_ESTILOS[texto] ?? { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" };
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ background: estilo.bg, color: estilo.text }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: estilo.dot }} />
            {texto}
        </span>
    );
}

/** Misma tarjeta que se usa en los resultados de búsqueda de paciente (foto + datos), reutilizada al ya tener el paciente seleccionado. */
function PacienteCard({ p }: { p: PacienteBusqueda }) {
    return (
        <div
            className="flex items-stretch gap-3 rounded-lg border p-4"
            style={{ borderColor: "var(--border-default)" }}
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

type Vista = "listado" | "buscar-paciente" | "orden";

const HEADER_INICIAL = {
    idContrato: undefined as number | undefined,
    idSubentidad: undefined as number | undefined,
    idSede: undefined as number | undefined,
    idIngreso: undefined as number | undefined,
    idEmpleado: undefined as number | undefined,
    idTipoAfiliado: undefined as number | undefined,
    idTipoUsuario: undefined as number | undefined,
    idTipoEstudio: undefined as number | undefined,
    idEspecimen: undefined as number | undefined,
    idAmbito: undefined as number | undefined,
    idFinalidadConsulta: undefined as number | undefined,
    autorizacion: "",
    numeroOrden: "",
    fechaOrden: new Date().toISOString().slice(0, 10),
    comentarios: "",
};

const DETALLE_INICIAL = {
    codigoCups: "",
    nombreCups: "",
    tipo: "O",
    valor: undefined as number | undefined,
    copago: 0,
};

interface DetalleTemp {
    tempId: number;
    codigoCups: string;
    nombreCups: string;
    tipo: string;
    valor: number;
    copago: number;
}

/** Busca en un catálogo la opción cuyo nombre contenga el texto (para preseleccionar el valor por defecto). */
function buscarPorNombre(opciones: LookupItem[], contiene: string) {
    return opciones.find((o) => o.nombre?.toUpperCase().includes(contiene));
}

export default function OrdenesPage() {
    const [vista, setVista] = useState<Vista>("listado");

    // --- listado ---
    const [listado, setListado] = useState<OrdenListadoResult | null>(null);
    const [listadoLoading, setListadoLoading] = useState(true);
    const [listadoError, setListadoError] = useState<string | null>(null);
    const [imprimiendoId, setImprimiendoId] = useState<number | null>(null);
    const [listadoQuery, setListadoQuery] = useState("");
    const [listadoPage, setListadoPage] = useState(1);
    const [filtroAnio, setFiltroAnio] = useState<string>("");
    const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
    const [filtroFechaFin, setFiltroFechaFin] = useState("");
    const [filtroTipoEstudio, setFiltroTipoEstudio] = useState<string>("");
    const [filtroEstado, setFiltroEstado] = useState<string>("");
    const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([]);

    // --- búsqueda / selección de paciente ---
    const [searchTerm, setSearchTerm] = useState("");
    const [pacientes, setPacientes] = useState<PacienteBusqueda[]>([]);
    const [paciente, setPaciente] = useState<PacienteBusqueda | null>(null);
    const [buscando, setBuscando] = useState(false);
    const [busquedaHecha, setBusquedaHecha] = useState(false);

    // --- registro rápido de paciente nuevo ---
    const [dialogPacienteOpen, setDialogPacienteOpen] = useState(false);
    const [tiposIdentificacion, setTiposIdentificacion] = useState<TipoIdentificacion[]>([]);

    // --- catálogos ---
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [subentidades, setSubentidades] = useState<LookupItem[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [ingresos, setIngresos] = useState<LookupItem[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [tiposAfiliado, setTiposAfiliado] = useState<LookupItem[]>([]);
    const [tiposUsuario, setTiposUsuario] = useState<LookupItem[]>([]);
    const [tiposEstudio, setTiposEstudio] = useState<LookupItem[]>([]);
    const [especimenes, setEspecimenes] = useState<Especimen[]>([]);
    const [ambitos, setAmbitos] = useState<LookupItem[]>([]);
    const [finalidadesConsulta, setFinalidadesConsulta] = useState<LookupItem[]>([]);

    // --- orden en curso ---
    const [header, setHeader] = useState(HEADER_INICIAL);
    const [creandoOrden, setCreandoOrden] = useState(false);
    const [ordenError, setOrdenError] = useState<string | null>(null);
    const [orden, setOrden] = useState<Orden | null>(null);
    const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
    const [detallesTemp, setDetallesTemp] = useState<DetalleTemp[]>([]);

    // --- formulario de línea (detalle) ---
    const [detalleForm, setDetalleForm] = useState(DETALLE_INICIAL);
    const [detalleError, setDetalleError] = useState<string | null>(null);
    const [guardandoDetalle, setGuardandoDetalle] = useState(false);
    const [cupsQuery, setCupsQuery] = useState("");
    const [cupsResultados, setCupsResultados] = useState<CupsItem[]>([]);

    const cargarListado = useCallback(
        async (page: number, q?: string, filtros?: { anio?: string; fechaInicio?: string; fechaFin?: string; idTipoEstudio?: string; estado?: string }) => {
            setListadoLoading(true);
            setListadoError(null);
            try {
                const qs = new URLSearchParams({ page: String(page), pageSize: "15" });
                if (q) qs.set("q", q);
                if (filtros?.anio) qs.set("anio", filtros.anio);
                if (filtros?.fechaInicio) qs.set("fechaInicio", filtros.fechaInicio);
                if (filtros?.fechaFin) qs.set("fechaFin", filtros.fechaFin);
                if (filtros?.idTipoEstudio) qs.set("idTipoEstudio", filtros.idTipoEstudio);
                if (filtros?.estado) qs.set("estado", filtros.estado);
                const res = await api.get<OrdenListadoResult>(`/admisiones/ordenes?${qs.toString()}`);
                setListado(res);
            } catch (err) {
                setListadoError(err instanceof ApiError ? err.message : "No se pudo cargar el listado de órdenes");
            } finally {
                setListadoLoading(false);
            }
        },
        [],
    );

    const filtrosActuales = {
        anio: filtroAnio,
        fechaInicio: filtroFechaInicio,
        fechaFin: filtroFechaFin,
        idTipoEstudio: filtroTipoEstudio,
        estado: filtroEstado,
    };

    useEffect(() => {
        if (vista === "listado") cargarListado(listadoPage, listadoQuery, filtrosActuales);
    }, [vista, listadoPage, cargarListado]);

    useEffect(() => {
        if (vista !== "listado") return;
        const t = setTimeout(() => {
            setListadoPage(1);
            cargarListado(1, listadoQuery, filtrosActuales);
        }, 350);
        return () => clearTimeout(t);
    }, [listadoQuery, filtroAnio, filtroFechaInicio, filtroFechaFin, filtroTipoEstudio, filtroEstado, vista, cargarListado]);

    useEffect(() => {
        api.get<number[]>("/admisiones/ordenes/anios").then(setAniosDisponibles).catch(() => setAniosDisponibles([]));
    }, []);

    // Cargar catálogos de apoyo una vez
    useEffect(() => {
        const cargarLookup = <T,>(tabla: string, setter: (v: T[]) => void) =>
            api.get<T[]>(`/catalogos/lookup/${tabla}`).then(setter).catch(() => setter([]));

        api.get<Contrato[]>("/entidades-contratos/contratos/activos").then(setContratos).catch(() => setContratos([]));
        api.get<Sede[]>("/admisiones/sedes").then(setSedes).catch(() => setSedes([]));
        api.get<Especimen[]>("/atenciones/especimenes/activos").then(setEspecimenes).catch(() => setEspecimenes([]));
        api.get<Empleado[]>("/seguridad/empleados/activos").then(setEmpleados).catch(() => setEmpleados([]));
        api.get<{ id: number; nombreTipoEstudio: string }[]>("/catalogos/tipo-estudio")
            .then((r) => setTiposEstudio(r.map((t) => ({ id: t.id, nombre: t.nombreTipoEstudio }))))
            .catch(() => setTiposEstudio([]));
        cargarLookup("ingreso", setIngresos);
        cargarLookup("tipo-afiliado", setTiposAfiliado);
        cargarLookup("tipo-usuario", setTiposUsuario);
        cargarLookup("ambito-procedimiento", setAmbitos);
        cargarLookup("finalidad-consulta", setFinalidadesConsulta);
        api.get<TipoIdentificacion[]>("/catalogos/tipo-identificacion").then(setTiposIdentificacion).catch(() => setTiposIdentificacion([]));
    }, []);

    // Preselecciona los valores por defecto pedidos: Tipo Afiliado = Cotizante,
    // Regimen/Tipo Usuario = Contributivo, Ámbito = Ambulatorio, Finalidad = No Aplica.
    useEffect(() => {
        const def = buscarPorNombre(tiposAfiliado, "COTIZANTE");
        if (def) setHeader((h) => (h.idTipoAfiliado ? h : { ...h, idTipoAfiliado: Number(def.id) }));
    }, [tiposAfiliado]);
    useEffect(() => {
        const def = buscarPorNombre(tiposUsuario, "CONTRIBUTIVO");
        if (def) setHeader((h) => (h.idTipoUsuario ? h : { ...h, idTipoUsuario: Number(def.id) }));
    }, [tiposUsuario]);
    useEffect(() => {
        const def = buscarPorNombre(ambitos, "AMBULATORIO");
        if (def) setHeader((h) => (h.idAmbito ? h : { ...h, idAmbito: Number(def.id) }));
    }, [ambitos]);
    useEffect(() => {
        const def = buscarPorNombre(finalidadesConsulta, "NO APLICA");
        if (def) setHeader((h) => (h.idFinalidadConsulta ? h : { ...h, idFinalidadConsulta: Number(def.id) }));
    }, [finalidadesConsulta]);

    // Buscar paciente con debounce
    useEffect(() => {
        if (searchTerm.trim().length < 3) {
            setPacientes([]);
            setBusquedaHecha(false);
            return;
        }
        const t = setTimeout(async () => {
            setBuscando(true);
            try {
                const res = await api.get<{ data: PacienteBusqueda[] }>(
                    `/pacientes?page=1&pageSize=10&q=${encodeURIComponent(searchTerm)}`,
                );
                setPacientes(res.data);
            } catch {
                setPacientes([]);
            } finally {
                setBuscando(false);
                setBusquedaHecha(true);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm]);

    // Cargar subentidades cuando cambia el contrato elegido
    useEffect(() => {
        if (!header.idContrato) {
            setSubentidades([]);
            return;
        }
        api
            .get<LookupItem[]>(`/entidades-contratos/subentidades?idContrato=${header.idContrato}`)
            .then(setSubentidades)
            .catch(() => setSubentidades([]));
    }, [header.idContrato]);

    // Búsqueda de CUPS con debounce
    useEffect(() => {
        if (cupsQuery.trim().length < 2) {
            setCupsResultados([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await api.get<CupsItem[]>(`/catalogos/cups/search?q=${encodeURIComponent(cupsQuery)}`);
                setCupsResultados(res);
            } catch {
                setCupsResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [cupsQuery]);

    function iniciarNuevaAdmision() {
        setPaciente(null);
        setOrden(null);
        setDetalles([]);
        setHeader(HEADER_INICIAL);
        setSearchTerm("");
        setDialogPacienteOpen(false);
        setVista("buscar-paciente");
    }

    function seleccionarPaciente(p: PacienteBusqueda) {
        setPaciente(p);
        setPacientes([]);
        setSearchTerm("");
        setVista("orden");
    }

    function alGuardarPacienteNuevo(nuevo: PacienteCompleto) {
        seleccionarPaciente(nuevo);
    }

    async function abrirOrdenExistente(o: OrdenListado) {
        setOrdenError(null);
        try {
            const [ordenCompleta, detallesOrden] = await Promise.all([
                api.get<any>(`/admisiones/ordenes/${o.id}`),
                api.get<DetalleOrden[]>(`/admisiones/ordenes/${o.id}/detalles`),
            ]);
            setPaciente(ordenCompleta.paciente ?? null);
            setOrden(ordenCompleta);
            setDetalles(detallesOrden);
            setHeader((h) => ({ ...h, idTipoEstudio: ordenCompleta.idTipoEstudio }));
            setVista("orden");
        } catch (err) {
            setListadoError(err instanceof ApiError ? err.message : "No se pudo abrir la orden");
        }
    }

    function volverAlListado() {
        setVista("listado");
        cargarListado(listadoPage, listadoQuery, filtrosActuales);
    }

    async function imprimirEstudio(o: OrdenListado, e: React.MouseEvent) {
        e.stopPropagation();
        setImprimiendoId(o.id);
        setListadoError(null);
        try {
            const url = await apiFetchBlobUrl(`/atenciones/patologia/orden/${o.id}/pdf`);
            window.open(url, "_blank");
        } catch (err) {
            setListadoError(
                err instanceof ApiError
                    ? `No se pudo generar el reporte: ${err.message}`
                    : "No se pudo generar el reporte de este estudio",
            );
        } finally {
            setImprimiendoId(null);
        }
    }

    async function crearOrden() {
        if (!paciente) return;
        const requeridos: (keyof typeof header)[] = [
            "idContrato",
            "idSubentidad",
            "idSede",
            "idIngreso",
            "idEmpleado",
            "idTipoAfiliado",
            "idTipoUsuario",
            "idTipoEstudio",
            "idEspecimen",
        ];
        const faltante = requeridos.find((k) => !header[k]);
        if (faltante) {
            setOrdenError("Completa todos los campos obligatorios de la orden.");
            return;
        }
        if (detallesTemp.length === 0) {
            setOrdenError("Agrega al menos un estudio antes de registrar la orden.");
            return;
        }
        setCreandoOrden(true);
        setOrdenError(null);
        try {
            const nuevaOrden = await api.post<Orden>("/admisiones/ordenes", {
                idUsuario: paciente.id,
                ...header,
                numeroOrden: header.numeroOrden || undefined,
                detalles: detallesTemp.map((d) => ({
                    codigoCups: d.codigoCups,
                    idAmbito: header.idAmbito,
                    idTipoEstudio: header.idTipoEstudio,
                    tipo: d.tipo,
                    valor: d.valor,
                    copago: d.copago,
                })),
            });
            const detallesReales = await api.get<DetalleOrden[]>(`/admisiones/ordenes/${nuevaOrden.id}/detalles`);
            setOrden(nuevaOrden);
            setDetalles(detallesReales);
            setDetallesTemp([]);
        } catch (err) {
            setOrdenError(err instanceof ApiError ? err.message : "No se pudo registrar la orden");
        } finally {
            setCreandoOrden(false);
        }
    }

    function elegirCups(c: CupsItem) {
        setDetalleForm((f) => ({ ...f, codigoCups: c.codigoCups, nombreCups: c.nombreCups }));
        setCupsQuery(`${c.codigoCups} — ${c.nombreCups}`);
        setCupsResultados([]);
    }

    async function agregarDetalle() {
        if (!detalleForm.codigoCups) {
            setDetalleError("Selecciona un CUPS.");
            return;
        }
        if (!header.idAmbito) {
            setDetalleError("Selecciona el Ámbito del Procedimiento en la columna izquierda.");
            return;
        }
        setGuardandoDetalle(true);
        setDetalleError(null);
        try {
            let valor = detalleForm.valor;
            if (valor === undefined && header.idContrato) {
                const tarifa = await api.get<number | null>(
                    `/admisiones/ordenes/tarifa?idContrato=${header.idContrato}&codigoCups=${detalleForm.codigoCups}`,
                );
                if (tarifa !== null) valor = tarifa;
            }
            if (valor === undefined) {
                setDetalleError("No se encontró tarifa pactada para este CUPS. Indica el valor manualmente.");
                return;
            }
            const copago = detalleForm.copago ?? 0;

            if (orden) {
                // La orden ya existe (se abrió del listado o ya se registró): se agrega directo al backend.
                const nuevoDetalle = await api.post<DetalleOrden>(`/admisiones/ordenes/${orden.id}/detalles`, {
                    codigoCups: detalleForm.codigoCups,
                    idAmbito: header.idAmbito,
                    idTipoEstudio: header.idTipoEstudio ?? orden.idTipoEstudio,
                    tipo: detalleForm.tipo,
                    valor,
                    copago,
                });
                setDetalles((prev) => [...prev, nuevoDetalle]);
            } else {
                // Todavía no existe la orden: se agrega a la tabla temporal en memoria.
                setDetallesTemp((prev) => [
                    ...prev,
                    {
                        tempId: Date.now(),
                        codigoCups: detalleForm.codigoCups,
                        nombreCups: detalleForm.nombreCups,
                        tipo: detalleForm.tipo,
                        valor,
                        copago,
                    },
                ]);
            }
            setDetalleForm(DETALLE_INICIAL);
            setCupsQuery("");
        } catch (err) {
            setDetalleError(err instanceof ApiError ? err.message : "No se pudo agregar el procedimiento");
        } finally {
            setGuardandoDetalle(false);
        }
    }

    async function cancelarDetalle(id: number) {
        try {
            await api.patch(`/admisiones/ordenes/detalles/${id}/cancelar`);
            setDetalles((prev) => prev.map((d) => (d.id === id ? { ...d, estado: "CANCELADO" } : d)));
        } catch {
            // silencioso
        }
    }

    function quitarDetalleTemp(tempId: number) {
        setDetallesTemp((prev) => prev.filter((d) => d.tempId !== tempId));
    }

    const totalOrden = orden
        ? detalles.filter((d) => estadoTexto(d.estado) !== "CANCELADO").reduce((acc, d) => acc + (d.neto ?? d.valor ?? 0), 0)
        : detallesTemp.reduce((acc, d) => acc + (d.valor - d.copago), 0);

    const netoPreview = (detalleForm.valor ?? 0) - (detalleForm.copago ?? 0);
    const totalPaginas = listado ? Math.max(1, Math.ceil(listado.total / listado.pageSize)) : 1;

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Admisiones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Órdenes o Admisiones de Pacientes</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        {vista === "listado"
                            ? listado
                                ? `${listado.total.toLocaleString()} órdenes registradas`
                                : "Listado de órdenes registradas"
                            : "Admisión del paciente y solicitud de procedimientos"}
                    </p>
                </div>
                {vista === "listado" ? (
                    <Button size="sm" onClick={iniciarNuevaAdmision}>
                        <ClipboardPlus className="mr-2 h-4 w-4" />
                        Nueva Admisión
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" onClick={volverAlListado}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al listado
                    </Button>
                )}
            </div>

            {vista === "listado" && (
                <div className="space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por No. de orden, consecutivo o paciente..."
                            className="pl-9"
                            value={listadoQuery}
                            onChange={(e) => setListadoQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground">Año</label>
                            <select
                                className="h-9 w-28 rounded-md border bg-transparent px-3 text-sm"
                                value={filtroAnio}
                                onChange={(e) => setFiltroAnio(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {aniosDisponibles.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground">Fecha inicio</label>
                            <Input
                                type="date"
                                className="w-40"
                                value={filtroFechaInicio}
                                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground">Fecha final</label>
                            <Input
                                type="date"
                                className="w-40"
                                value={filtroFechaFin}
                                onChange={(e) => setFiltroFechaFin(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground">Estudio</label>
                            <select
                                className="h-9 w-48 rounded-md border bg-transparent px-3 text-sm"
                                value={filtroTipoEstudio}
                                onChange={(e) => setFiltroTipoEstudio(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {tiposEstudio.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-muted-foreground">Estado</label>
                            <select
                                className="h-9 w-40 rounded-md border bg-transparent px-3 text-sm"
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="PROCESO">Proceso</option>
                                <option value="ATENDIDO">Atendido</option>
                                <option value="CANCELADO">Cancelado</option>
                                <option value="FACTURADO">Facturado</option>
                            </select>
                        </div>
                        {(filtroAnio || filtroFechaInicio || filtroFechaFin || filtroTipoEstudio || filtroEstado) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFiltroAnio("");
                                    setFiltroFechaInicio("");
                                    setFiltroFechaFin("");
                                    setFiltroTipoEstudio("");
                                    setFiltroEstado("");
                                }}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>

                    {listadoError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{listadoError}</p>}

                    <div className="rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Orden</TableHead>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Espécimen / Estudio</TableHead>
                                    <TableHead>Contrato / Sede</TableHead>
                                    <TableHead>Comentarios</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                    <TableHead
                                        className="sticky right-0 w-[90px] border-l"
                                        style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                    />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!listadoLoading && (!listado || listado.data.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                            No hay órdenes registradas todavía.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {listado?.data.map((o) => {
                                    const p = o.paciente;
                                    return (
                                        <TableRow key={o.id} className="align-top hover:bg-muted/40">
                                            <TableCell className="py-3">
                                                <p className="font-bold">{o.consecutivo}</p>
                                                <p className="text-xs text-muted-foreground">{o.fechaIngreso}</p>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="font-bold">{p ? nombrePaciente(p).toUpperCase() : "—"}</p>
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
                                                {o.especimen?.nombre ?? "—"}
                                                {o.tipoEstudio?.nombreTipoEstudio ? ` - ${o.tipoEstudio.nombreTipoEstudio}` : ""}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="text-sm">{o.contrato?.nombre ?? "—"}</p>
                                                <p className="text-xs text-muted-foreground">{o.sede?.nombre ?? "—"}</p>
                                            </TableCell>
                                            <TableCell className="max-w-[220px] py-3 text-xs text-muted-foreground">
                                                <p className="line-clamp-2">{o.comentarios || "—"}</p>
                                            </TableCell>
                                            <TableCell className="py-3 text-center">
                                                <EstadoBadge estado={o.estado} />
                                            </TableCell>
                                            <TableCell
                                                className="sticky right-0 flex items-center justify-center gap-1 border-l py-3"
                                                style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    title="Ver orden"
                                                    onClick={() => abrirOrdenExistente(o)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {estadoTexto(o.estado) === "ATENDIDO" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Imprimir reporte del estudio"
                                                        disabled={imprimiendoId === o.id}
                                                        onClick={(e) => imprimirEstudio(o, e)}
                                                    >
                                                        {imprimiendoId === o.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Printer className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {listado && listado.total > 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Página {listadoPage} de {totalPaginas}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={listadoPage <= 1} onClick={() => setListadoPage((p) => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                    Anterior
                                </Button>
                                <Button variant="outline" size="sm" disabled={listadoPage >= totalPaginas} onClick={() => setListadoPage((p) => p + 1)}>
                                    Siguiente
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {vista === "buscar-paciente" && (
                <div className="rounded-lg border p-5" style={{ borderColor: "var(--border-default)" }}>
                    <p className="mb-3 text-sm font-medium">Buscar Paciente</p>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Identificación o nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setDialogPacienteOpen(false);
                            }}
                            autoFocus
                        />
                        {buscando && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                    </div>

                    {pacientes.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {pacientes.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => seleccionarPaciente(p)}
                                    className="text-left transition-opacity hover:opacity-80"
                                >
                                    <PacienteCard p={p} />
                                </button>
                            ))}
                        </div>
                    )}

                    {busquedaHecha && !buscando && pacientes.length === 0 && (
                        <div className="mt-3 rounded-md border border-dashed p-4 text-center" style={{ borderColor: "var(--border-default)" }}>
                            <p className="mb-2 text-sm text-muted-foreground">No se encontró ningún paciente.</p>
                            <Button size="sm" variant="outline" onClick={() => setDialogPacienteOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Registrar Nuevo Paciente
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {vista === "orden" && paciente && (
                <div className="grid grid-cols-10 gap-4">
                    {/* Columna izquierda: 30% */}
                    <div className="col-span-10 space-y-4 lg:col-span-3">
                        <PacienteCard p={paciente} />
                        {!orden && (
                            <Button variant="ghost" size="sm" onClick={() => setVista("buscar-paciente")}>
                                Cambiar Paciente
                            </Button>
                        )}

                        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-medium">Clasificación</p>
                            <div className="space-y-3">
                                <Selector
                                    label="Tipo Afiliado"
                                    value={header.idTipoAfiliado}
                                    onChange={(v) => setHeader((h) => ({ ...h, idTipoAfiliado: v }))}
                                    options={tiposAfiliado}
                                    disabled={!!orden}
                                />
                                <Selector
                                    label="Regimen, Tipo Usuario"
                                    value={header.idTipoUsuario}
                                    onChange={(v) => setHeader((h) => ({ ...h, idTipoUsuario: v }))}
                                    options={tiposUsuario}
                                    disabled={!!orden}
                                />
                                <Selector
                                    label="Ambito del Procedimiento"
                                    value={header.idAmbito}
                                    onChange={(v) => setHeader((h) => ({ ...h, idAmbito: v }))}
                                    options={ambitos}
                                />
                                <Selector
                                    label="Finalidad"
                                    value={header.idFinalidadConsulta}
                                    onChange={(v) => setHeader((h) => ({ ...h, idFinalidadConsulta: v }))}
                                    options={finalidadesConsulta}
                                    disabled={!!orden}
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Comentarios</label>
                                    <Textarea
                                        rows={4}
                                        value={header.comentarios}
                                        disabled={!!orden}
                                        onChange={(e) => setHeader((h) => ({ ...h, comentarios: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: 70% */}
                    <div className="col-span-10 space-y-4 lg:col-span-7">
                        {!orden && (
                            <div className="rounded-lg border p-5" style={{ borderColor: "var(--border-default)" }}>
                                <p className="mb-3 text-sm font-medium">Datos de la Orden</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <Selector label="Entidad o Contrato" value={header.idContrato} onChange={(v) => setHeader((h) => ({ ...h, idContrato: v, idSubentidad: undefined }))} options={contratos.map((c) => ({ id: c.id, nombre: `${c.nombre} — ${c.entidad?.nombreEntidad ?? c.codigoEntidad}` }))} />
                                    <Selector label="Subentidad" value={header.idSubentidad} onChange={(v) => setHeader((h) => ({ ...h, idSubentidad: v }))} options={subentidades} disabled={!header.idContrato} />
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Fecha de Toma de Muestra</label>
                                        <Input
                                            type="date"
                                            value={header.fechaOrden}
                                            onChange={(e) => setHeader((h) => ({ ...h, fechaOrden: e.target.value }))}
                                        />
                                    </div>
                                    <Selector label="Sede" value={header.idSede} onChange={(v) => setHeader((h) => ({ ...h, idSede: v }))} options={sedes} />
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Fecha Entrega (calculada, +7 días hábiles)</label>
                                        <Input value={sumarDiasHabiles(header.fechaOrden, 7)} disabled />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">Autorizacion</label>
                                        <Input value={header.autorizacion} onChange={(e) => setHeader((h) => ({ ...h, autorizacion: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12.5px] font-medium">No. de Orden (opcional, se sugiere una)</label>
                                        <Input
                                            value={header.numeroOrden}
                                            onChange={(e) => setHeader((h) => ({ ...h, numeroOrden: e.target.value }))}
                                            placeholder="Se genera automáticamente si se deja vacío"
                                        />
                                    </div>
                                    <Selector label="Tipo de Estudio" value={header.idTipoEstudio} onChange={(v) => setHeader((h) => ({ ...h, idTipoEstudio: v }))} options={tiposEstudio} />
                                    <Selector label="Médico" value={header.idEmpleado} onChange={(v) => setHeader((h) => ({ ...h, idEmpleado: v }))} options={empleados.map((e) => ({ id: e.id, nombre: `${e.nombreEmpleado}${e.cargo ? ` — ${e.cargo.nombreCargo}` : "" }` }))} />
                                    <Selector label="Especimen" value={header.idEspecimen} onChange={(v) => setHeader((h) => ({ ...h, idEspecimen: v }))} options={especimenes} />
                                    <Selector label="Tipo de Ingreso" value={header.idIngreso} onChange={(v) => setHeader((h) => ({ ...h, idIngreso: v }))} options={ingresos} />
                                </div>
                            </div>
                        )}

                        {orden && (
                            <div
                                className="grid grid-cols-4 gap-4 rounded-lg border px-5 py-4"
                                style={{ borderColor: "var(--border-default)" }}
                            >
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">No. de Orden</p>
                                    <p className="font-medium">{orden.numeroOrden}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Consecutivo Orden</p>
                                    <p className="font-medium">{orden.id}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Cons. Estudio</p>
                                    <p className="font-medium">{orden.consecutivo}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Fecha Entrega</p>
                                    <p className="font-medium">{sumarDiasHabiles(orden.fechaOrden, 7)}</p>
                                </div>
                                <div className="col-span-2 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-default)" }}>
                                    <p className="text-xs text-muted-foreground">Fecha Ingreso: {orden.fechaIngreso}</p>
                                    <Badge variant="outline">{estadoTexto(orden.estado)}</Badge>
                                </div>
                            </div>
                        )}

                        <div className="rounded-lg border p-5" style={{ borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-sm font-medium">Seleccione Estudios</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative col-span-2 space-y-1.5">
                                    <label className="text-[12.5px] font-medium">CUPS</label>
                                    <Input
                                        placeholder="Buscar por código o nombre..."
                                        value={cupsQuery}
                                        onChange={(e) => setCupsQuery(e.target.value)}
                                    />
                                    {cupsResultados.length > 0 && (
                                        <div
                                            className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                                            style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                        >
                                            {cupsResultados.map((c) => (
                                                <button
                                                    key={c.codigoCups}
                                                    type="button"
                                                    className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                                    onClick={() => elegirCups(c)}
                                                >
                                                    <span className="font-semibold">{c.codigoCups}</span> — {c.nombreCups}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Valor</label>
                                    <Input
                                        type="number"
                                        placeholder="Tarifa del contrato"
                                        value={detalleForm.valor ?? ""}
                                        onChange={(e) => setDetalleForm((f) => ({ ...f, valor: Number(e.target.value) || undefined }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Copago</label>
                                    <Input
                                        type="number"
                                        value={detalleForm.copago ?? 0}
                                        onChange={(e) => setDetalleForm((f) => ({ ...f, copago: Number(e.target.value) || 0 }))}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12.5px] font-medium">Neto</label>
                                    <Input value={netoPreview.toLocaleString()} disabled />
                                </div>
                            </div>
                            {detalleError && <p className="mt-3 text-sm text-red-600">{detalleError}</p>}
                            <Button className="mt-4" onClick={agregarDetalle} disabled={guardandoDetalle}>
                                {guardandoDetalle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Plus className="mr-2 h-4 w-4" />
                                Agregar Estudio
                            </Button>
                        </div>

                        <div className="rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>CODIGO</TableHead>
                                        <TableHead>NOMBRE</TableHead>
                                        <TableHead className="text-right">VALOR</TableHead>
                                        <TableHead className="text-right">COPAGO</TableHead>
                                        <TableHead className="text-right">NETO</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Acción</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!orden && detallesTemp.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                                                Aún no se han agregado estudios.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!orden &&
                                        detallesTemp.map((d) => (
                                            <TableRow key={d.tempId}>
                                                <TableCell className="font-medium">{d.codigoCups}</TableCell>
                                                <TableCell>{d.nombreCups || "—"}</TableCell>
                                                <TableCell className="text-right">${d.valor.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${d.copago.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${(d.valor - d.copago).toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">Por Registrar</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => quitarDetalleTemp(d.tempId)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    {orden && detalles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-20 text-center text-sm text-muted-foreground">
                                                Aún no se han agregado procedimientos.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {orden &&
                                        detalles.map((d) => (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium">{d.codigoCups}</TableCell>
                                                <TableCell>{d.cups?.nombreCups ?? "—"}</TableCell>
                                                <TableCell className="text-right">${d.valor.toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${(d.copago ?? 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${(d.neto ?? d.valor).toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={estadoTexto(d.estado) === "CANCELADO" ? "destructive" : "outline"}>{estadoTexto(d.estado)}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {estadoTexto(d.estado) !== "CANCELADO" && (
                                                        <Button variant="ghost" size="sm" onClick={() => cancelarDetalle(d.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>

                        {(orden ? detalles.length > 0 : detallesTemp.length > 0) && (
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold">Total orden: ${totalOrden.toLocaleString()}</p>
                                {!orden && (
                                    <Button onClick={crearOrden} disabled={creandoOrden}>
                                        {creandoOrden && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <ClipboardPlus className="mr-2 h-4 w-4" />
                                        Registrar Orden
                                    </Button>
                                )}
                            </div>
                        )}
                        {ordenError && <p className="text-sm text-red-600">{ordenError}</p>}
                    </div>
                </div>
            )}

            <PacienteFormDialog
                open={dialogPacienteOpen}
                onOpenChange={setDialogPacienteOpen}
                editando={null}
                tiposIdentificacion={tiposIdentificacion}
                identificacionSugerida={searchTerm}
                onSaved={alGuardarPacienteNuevo}
            />
        </div>
    );
}

function Selector({
    label,
    value,
    onChange,
    options,
    disabled,
}: {
    label: string;
    value: number | string | undefined;
    onChange: (v: number) => void;
    options: { id: number | string; nombre: string }[];
    disabled?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium">{label}</label>
            <select
                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-50"
                value={value ?? ""}
                disabled={disabled}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                <option value="">Seleccionar…</option>
                {options.map((o) => (
                    <option key={o.id} value={o.id}>
                        {o.nombre}
                    </option>
                ))}
            </select>
        </div>
    );
}
