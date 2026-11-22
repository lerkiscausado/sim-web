"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Search,
    RefreshCw,
    Loader2,
    FileSpreadsheet,
    FileDown,
    Printer,
    FileArchive,
    MoreHorizontal,
    FileText,
    Paperclip,
    Camera,
    Mail,
    Receipt,
    Hash,
    User,
    Building2,
    TestTube2,
    X,
    ClipboardPlus,
    CalendarDays,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { ErrorDialog } from "@/components/ui/error-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdjuntosDialog } from "@/components/ordenes/AdjuntosDialog";
import { ImagenesDialog } from "@/components/ordenes/ImagenesDialog";
import { CorreoDialog } from "@/components/ordenes/CorreoDialog";
import { api, ApiError } from "@/lib/api";
import { abrirPdf, descargarArchivo } from "@/lib/descargas";
import { useAuth } from "@/lib/auth";
import { useFeedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/select";
import { TAMANO_PAGINA_DEFECTO, useTamanoPagina } from "@/lib/useTabla";
import { EstadoOrden, Etiqueta, Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FilaConsulta {
    orden: number;
    consecutivo: string;
    fechaIngreso: string;
    identificacion: string;
    nombre: string;
    sexo: string;
    edad: number | null;
    telefono: string;
    correo: string;
    contrato: string;
    entidad: string;
    estudio: string;
    prefijo: string;
    comentarios: string;
    estado: string;
    especimen: string;
    sede: string;
    idSede: number;
    subentidad: string;
}

interface Resultado {
    data: FilaConsulta[];
    total: number;
    page: number;
    pageSize: number;
}

interface Sede {
    id: number;
    nombre: string;
}
interface TipoEstudio {
    id: number;
    nombreTipoEstudio: string;
}

/**
 * Consultar Órdenes es el historial: órdenes ya atendidas, facturadas o canceladas.
 * Las pendientes y en proceso se trabajan en Órdenes (/admisiones/ordenes).
 */
const ESTADOS = ["ATENDIDO", "FACTURADO", "CANCELADO"];
const HISTORIAL = ESTADOS.join(",");
const ESTADO_TEXTO: Record<string, string> = {
    "": "Todo el historial",
    ATENDIDO: "Atendidas",
    FACTURADO: "Facturadas",
    CANCELADO: "Canceladas",
};
const fechaCorta = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");
const firmado = (f: FilaConsulta) => f.estado === "ATENDIDO" || f.estado === "FACTURADO";

/**
 * Consultar Órdenes — réplica web de frmConsultarCDPatologia (rama sandra,
 * licencia 16): grilla de todas las órdenes con filtro por año, exportar a
 * Excel/PDF, imprimir, exportar lote de PDF y las acciones del menú principal
 * sobre la orden seleccionada (informe, adjuntos, imágenes, correo, recibo).
 */
export default function ConsultarOrdenesPage() {
    const { confirmar } = useFeedback();
    const { hasPermission } = useAuth();
    const anioActual = new Date().getFullYear();
    const [anios, setAnios] = useState<number[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [tipos, setTipos] = useState<TipoEstudio[]>([]);
    const [filtros, setFiltros] = useState({
        q: "",
        anio: String(anioActual),
        fechaInicio: "",
        fechaFin: "",
        estado: "",
        idSede: "",
        idTipoEstudio: "",
    });
    const [qDebounced, setQDebounced] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useTamanoPagina("consulta-ordenes");
    const [resultado, setResultado] = useState<Resultado>({ data: [], total: 0, page: 1, pageSize: TAMANO_PAGINA_DEFECTO });
    const [cargando, setCargando] = useState(false);
    const [trabajando, setTrabajando] = useState<string | null>(null);
    const [error, setError] = useState<{ titulo: string; mensaje: string; detalles?: string[] } | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
    const [activa, setActiva] = useState<FilaConsulta | null>(null);
    const [dialogo, setDialogo] = useState<"adjuntos" | "imagenes" | "correo" | null>(null);

    // Búsqueda que llega desde el buscador global (Ctrl K): /admisiones?q=texto
    useEffect(() => {
        const q = new URLSearchParams(window.location.search).get("q");
        if (q) {
            setFiltros((f) => ({ ...f, q, anio: "" }));
            setQDebounced(q);
        }
    }, []);

    useEffect(() => {
        api.get<number[]>("/admisiones/consulta/anios").then(setAnios).catch(() => setAnios([anioActual]));
        api.get<Sede[]>("/admisiones/sedes").then(setSedes).catch(() => undefined);
        api.get<TipoEstudio[]>("/catalogos/tipo-estudio").then(setTipos).catch(() => undefined);
    }, [anioActual]);

    useEffect(() => {
        const t = setTimeout(() => setQDebounced(filtros.q), 400);
        return () => clearTimeout(t);
    }, [filtros.q]);

    const query = useMemo(() => {
        const p = new URLSearchParams();
        if (qDebounced.trim()) p.set("q", qDebounced.trim());
        if (filtros.anio) p.set("anio", filtros.anio);
        if (filtros.fechaInicio) p.set("fechaInicio", filtros.fechaInicio);
        if (filtros.fechaFin) p.set("fechaFin", filtros.fechaFin);
        p.set("estado", filtros.estado || HISTORIAL);
        if (filtros.idSede) p.set("idSede", filtros.idSede);
        if (filtros.idTipoEstudio) p.set("idTipoEstudio", filtros.idTipoEstudio);
        return p;
    }, [qDebounced, filtros.anio, filtros.fechaInicio, filtros.fechaFin, filtros.estado, filtros.idSede, filtros.idTipoEstudio]);

    const cargar = useCallback(async () => {
        setCargando(true);
        try {
            const p = new URLSearchParams(query);
            p.set("page", String(page));
            p.set("pageSize", String(pageSize));
            setResultado(await api.get<Resultado>(`/admisiones/consulta?${p.toString()}`));
        } catch (e) {
            setError({ titulo: "No se pudieron consultar las órdenes", mensaje: e instanceof ApiError ? e.message : "Error de conexión" });
        } finally {
            setCargando(false);
        }
    }, [query, page, pageSize]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    /** Cantidad de órdenes por estado con los demás filtros aplicados (pestañas de estado). */
    const [conteos, setConteos] = useState<Record<string, number>>({});
    const queryBase = useMemo(() => {
        const p = new URLSearchParams(query);
        p.delete("estado");
        return p.toString();
    }, [query]);
    useEffect(() => {
        let vigente = true;
        Promise.all(
            ["", ...ESTADOS].map(async (e) => {
                const p = new URLSearchParams(queryBase);
                p.set("estado", e || HISTORIAL);
                p.set("page", "1");
                p.set("pageSize", "1");
                const r = await api.get<Resultado>(`/admisiones/consulta?${p.toString()}`);
                return [e, r.total] as const;
            }),
        )
            .then((pares) => vigente && setConteos(Object.fromEntries(pares)))
            .catch(() => vigente && setConteos({}));
        return () => {
            vigente = false;
        };
    }, [queryBase]);

    useEffect(() => {
        setPage(1);
        setSeleccion(new Set());
    }, [query]);

    function cambiar<K extends keyof typeof filtros>(k: K, v: string) {
        setFiltros((f) => ({ ...f, [k]: v }));
    }

    async function ejecutar(nombre: string, accion: () => Promise<unknown>, tituloError: string) {
        setTrabajando(nombre);
        setAviso(null);
        try {
            await accion();
        } catch (e) {
            setError({
                titulo: tituloError,
                mensaje: e instanceof ApiError ? e.message : "Error inesperado",
                detalles: e instanceof ApiError ? e.details : undefined,
            });
        } finally {
            setTrabajando(null);
        }
    }

    const exportarExcel = () =>
        ejecutar("excel", () => descargarArchivo(`/admisiones/consulta/exportar/excel?${query.toString()}`, { nombrePorDefecto: "Ordenes.xlsx" }), "No se pudo exportar a Excel");
    const exportarPdf = () => ejecutar("pdf", () => abrirPdf(`/admisiones/consulta/exportar/pdf?${query.toString()}`), "No se pudo exportar a PDF");

    async function exportarLote() {
        const ids = [...seleccion];
        const cuantos = ids.length || Math.min(resultado.total, 300);
        const texto = ids.length
            ? `Se exportarán los resultados de ${ids.length} órdenes seleccionadas.`
            : `No hay órdenes marcadas: se exportarán las ${cuantos} órdenes del filtro actual${resultado.total > 300 ? " (máximo 300)" : ""}.`;
        if (!(await confirmar({ titulo: "Exportar lote de resultados", mensaje: `${texto}\n\nEste proceso puede tomar unos minutos.`, textoAceptar: "Exportar" }))) return;
        await ejecutar(
            "lote",
            async () => {
                const filtrosObj = Object.fromEntries(query.entries());
                const headers = await descargarArchivo("/admisiones/consulta/exportar/lote", {
                    metodo: "POST",
                    cuerpo: ids.length ? { ids } : { filtros: filtrosObj },
                    nombrePorDefecto: "Resultados.zip",
                });
                const g = headers.get("X-Generados");
                const o = headers.get("X-Omitidos");
                setAviso(`Reportes exportados con éxito: ${g ?? "?"} PDF${o && o !== "0" ? ` · ${o} órdenes sin informe (ver _omitidos.txt dentro del ZIP)` : ""}.`);
            },
            "No se pudo exportar el lote",
        );
    }

    function toggle(id: number) {
        setSeleccion((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    }
    const todasMarcadas = resultado.data.length > 0 && resultado.data.every((f) => seleccion.has(f.orden));
    function toggleTodas() {
        setSeleccion((s) => {
            const n = new Set(s);
            if (todasMarcadas) resultado.data.forEach((f) => n.delete(f.orden));
            else resultado.data.forEach((f) => n.add(f.orden));
            return n;
        });
    }

    const verInforme = (f: FilaConsulta, variante?: string) =>
        ejecutar(`inf-${f.orden}`, () => abrirPdf(`/admisiones/consulta/${f.orden}/estudio/pdf${variante ? `?variante=${variante}` : ""}`), "No se pudo generar el informe");
    const reciboEntrega = (f: FilaConsulta) =>
        ejecutar(`rec-${f.orden}`, () => abrirPdf(`/admisiones/consulta/${f.orden}/entrega-resultados/pdf`), "Recibo de entrega");

    function abrirDialogo(f: FilaConsulta, d: "adjuntos" | "imagenes" | "correo") {
        setActiva(f);
        setDialogo(d);
    }

    const hayFiltrosExtra = filtros.fechaInicio || filtros.fechaFin || filtros.idSede || filtros.idTipoEstudio;

    return (
        <div className="space-y-5">
            <div className="encabezado-modulo flex flex-wrap items-end justify-between gap-3">
                <div>
                    <span className="label-clinical inline-block" style={{ color: "var(--ink-brand)" }}>
                        Admisiones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Consultar Órdenes</h1>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Historial de órdenes atendidas, facturadas y canceladas · {resultado.total.toLocaleString()}{" "}
                        {filtros.estado ? ESTADO_TEXTO[filtros.estado].toLowerCase() : "órdenes"}
                        {filtros.anio ? ` en ${filtros.anio}` : ""}. Marque varias para exportarlas en lote.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={exportarExcel} disabled={!!trabajando}>
                        {trabajando === "excel" ? <Loader2 className="animate-spin" size={14} /> : <FileSpreadsheet size={14} />}
                        Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPdf} disabled={!!trabajando}>
                        {trabajando === "pdf" ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                        PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPdf} disabled={!!trabajando} title="Abre la grilla en PDF para imprimirla">
                        <Printer size={14} />
                        Imprimir
                    </Button>
                    {hasPermission("imprimir") && (
                        <Button variant="outline" size="sm" onClick={exportarLote} disabled={!!trabajando || resultado.total === 0} title="Exporta los resultados del filtro actual (o los marcados) en un ZIP de PDF">
                            {trabajando === "lote" ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />}
                            Lote PDF
                        </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admisiones/ordenes">
                            <ClipboardPlus size={14} /> Órdenes por atender
                        </Link>
                    </Button>
                </div>
            </div>

            {aviso && (
                <p className="flex items-center justify-between rounded-md px-4 py-2.5 text-[13px]" style={{ background: "var(--status-success-bg)", color: "var(--status-success)" }}>
                    {aviso}
                    <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
                        <X size={14} />
                    </button>
                </p>
            )}

            <Panel>
                <div className="flex flex-wrap items-center gap-2 border-b p-3" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="relative min-w-[240px] flex-1">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--ink-tertiary)" }} />
                        <Input
                            placeholder="Consecutivo, paciente, identificación, espécimen…"
                            className="h-8 pl-8 text-[13px]"
                            style={{ background: "var(--surface-inset)" }}
                            value={filtros.q}
                            onChange={(e) => cambiar("q", e.target.value)}
                            aria-label="Buscar órdenes"
                        />
                        {cargando && <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />}
                    </div>
                    <div role="tablist" aria-label="Estado de la orden" className="flex h-8 overflow-hidden rounded-[5px] border" style={{ borderColor: "var(--border-default)" }}>
                        {["", ...ESTADOS].map((e) => {
                            const activo = filtros.estado === e;
                            return (
                                <button
                                    key={e || "todas"}
                                    type="button"
                                    role="tab"
                                    aria-selected={activo}
                                    onClick={() => cambiar("estado", e)}
                                    className={cn(
                                        "flex items-center gap-1.5 border-r px-2.5 text-[12px] last:border-r-0",
                                        activo ? "bg-[var(--ink-primary)] text-white" : "hover:bg-[var(--surface-inset)]",
                                    )}
                                    style={{ borderColor: "var(--border-default)", color: activo ? undefined : "var(--ink-secondary)" }}
                                >
                                    {ESTADO_TEXTO[e]}
                                    {conteos[e] !== undefined && <span className="dato-mono text-[10.5px] opacity-70">{conteos[e].toLocaleString()}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--border-subtle)" }}>
                    <FiltroCompacto etiqueta="Año">
                        <Select selectClassName="h-8 text-[12.5px]" value={filtros.anio} onChange={(e) => cambiar("anio", e.target.value)} aria-label="Año">
                            <option value="">Todos</option>
                            {(anios.length ? anios : [anioActual]).map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </Select>
                    </FiltroCompacto>
                    <FiltroCompacto etiqueta={<CalendarDays size={13} />}>
                        <Input type="date" aria-label="Desde" className="h-8 w-auto text-[12.5px]" value={filtros.fechaInicio} onChange={(e) => cambiar("fechaInicio", e.target.value)} />
                        <span style={{ color: "var(--ink-tertiary)" }}>–</span>
                        <Input type="date" aria-label="Hasta" className="h-8 w-auto text-[12.5px]" value={filtros.fechaFin} onChange={(e) => cambiar("fechaFin", e.target.value)} />
                    </FiltroCompacto>
                    <FiltroCompacto etiqueta="Sede">
                        <Select selectClassName="h-8 text-[12.5px]" value={filtros.idSede} onChange={(e) => cambiar("idSede", e.target.value)} aria-label="Sede">
                            <option value="">Todas</option>
                            {sedes.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.nombre}
                                </option>
                            ))}
                        </Select>
                    </FiltroCompacto>
                    <FiltroCompacto etiqueta="Estudio">
                        <Select selectClassName="h-8 text-[12.5px]" value={filtros.idTipoEstudio} onChange={(e) => cambiar("idTipoEstudio", e.target.value)} aria-label="Estudio">
                            <option value="">Todos</option>
                            {tipos.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nombreTipoEstudio}
                                </option>
                            ))}
                        </Select>
                    </FiltroCompacto>
                    {hayFiltrosExtra && (
                        <Button variant="ghost" size="sm" onClick={() => setFiltros((f) => ({ ...f, fechaInicio: "", fechaFin: "", idSede: "", idTipoEstudio: "" }))}>
                            <X size={14} /> Limpiar
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={cargar} disabled={cargando} className="ml-auto" title="Actualizar vista">
                        <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                        Actualizar
                    </Button>
                </div>

                {seleccion.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-2 text-[12.5px] text-white" style={{ background: "var(--ink-primary)" }}>
                        <strong>
                            {seleccion.size} {seleccion.size === 1 ? "orden marcada" : "órdenes marcadas"}
                        </strong>
                        {hasPermission("imprimir") && (
                            <button
                                type="button"
                                onClick={exportarLote}
                                disabled={!!trabajando}
                                className="flex h-7 items-center gap-1.5 rounded-[5px] border px-2.5 disabled:opacity-50"
                                style={{ background: "#262b33", borderColor: "#363c46" }}
                            >
                                {trabajando === "lote" ? <Loader2 className="animate-spin" size={13} /> : <FileArchive size={13} />}
                                Exportar lote PDF (.zip)
                            </button>
                        )}
                        <button type="button" onClick={() => setSeleccion(new Set())} className="ml-auto h-7 px-2" style={{ color: "#9aa3af" }}>
                            Quitar selección
                        </button>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-9">
                                    <input type="checkbox" className="accent-[var(--clinical-500)]" checked={todasMarcadas} onChange={toggleTodas} aria-label="Marcar todas" />
                                </TableHead>
                                <TableHead>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Hash className="h-3 w-3" />
                                        Caso
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
                                        Estudio / Espécimen
                                    </span>
                                </TableHead>
                                <TableHead>Sede</TableHead>
                                <TableHead>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building2 className="h-3 w-3" />
                                        Entidad · Subentidad
                                    </span>
                                </TableHead>
                                <TableHead className="hidden 2xl:table-cell">Comentarios</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[84px]">
                                    <span className="sr-only">Acciones</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cargando && resultado.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                                        Consultando…
                                    </TableCell>
                                </TableRow>
                            )}
                            {!cargando && resultado.data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                                        No hay órdenes en el historial con estos filtros. Las pendientes y en proceso están en{" "}
                                        <Link href={filtros.q ? `/admisiones/ordenes?q=${encodeURIComponent(filtros.q)}` : "/admisiones/ordenes"} className="font-medium hover:underline" style={{ color: "var(--ink-brand)" }}>
                                            Órdenes por atender
                                        </Link>
                                        .
                                    </TableCell>
                                </TableRow>
                            )}
                            {resultado.data.map((f) => {
                                const marcada = seleccion.has(f.orden);
                                return (
                                    <TableRow
                                        key={f.orden}
                                        data-state={marcada ? "selected" : undefined}
                                        className={cn("group cursor-pointer", activa?.orden === f.orden && !marcada && "bg-[var(--surface-inset)]")}
                                        onClick={() => setActiva(f)}
                                        onDoubleClick={() => verInforme(f)}
                                    >
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className="accent-[var(--clinical-500)]"
                                                checked={marcada}
                                                onChange={() => toggle(f.orden)}
                                                aria-label={`Marcar ${f.consecutivo}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <p className="dato-mono text-[12.5px] font-semibold">{f.consecutivo || f.orden}</p>
                                            <p className="dato-mono text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
                                                {fechaCorta(f.fechaIngreso)}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium" style={{ color: "var(--ink-primary)" }}>
                                                {f.nombre}
                                            </p>
                                            <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                <span className="dato-mono">{f.identificacion}</span> · {f.sexo}
                                                {f.edad !== null ? ` · ${f.edad} a` : ""}
                                                {f.telefono ? ` · ${f.telefono}` : ""}
                                            </p>
                                            {f.comentarios && (
                                                <p className="max-w-[260px] truncate text-[11.5px] italic 2xl:hidden" style={{ color: "var(--ink-secondary)" }} title={f.comentarios}>
                                                    {f.comentarios}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="max-w-[240px]">
                                            <p>{f.estudio}</p>
                                            <p className="truncate text-[11.5px]" style={{ color: "var(--ink-tertiary)" }} title={f.especimen}>
                                                {f.especimen}
                                            </p>
                                        </TableCell>
                                        <TableCell>{f.sede && <Etiqueta>{f.sede}</Etiqueta>}</TableCell>
                                        <TableCell>
                                            <p>{f.entidad}</p>
                                            <p className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                                                {f.subentidad || "—"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="hidden max-w-[180px] text-[12px] 2xl:table-cell" style={{ color: "var(--ink-secondary)" }}>
                                            <span className="line-clamp-2 whitespace-normal">{f.comentarios}</span>
                                        </TableCell>
                                        <TableCell>
                                            <EstadoOrden estado={f.estado} />
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 group-data-[state=selected]:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    title={firmado(f) ? "Ver informe" : "Ver informe preliminar"}
                                                    aria-label={firmado(f) ? "Ver informe" : "Ver informe preliminar"}
                                                    onClick={() => verInforme(f)}
                                                    disabled={trabajando === `inf-${f.orden}`}
                                                >
                                                    {trabajando === `inf-${f.orden}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon-sm" title="Más acciones" aria-label="Más acciones">
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => verInforme(f)}>
                                                            <FileText size={14} /> {firmado(f) ? "Ver informe" : "Ver informe preliminar"}
                                                        </DropdownMenuItem>
                                                        {!["CV", "CB", "CR"].includes(f.prefijo) && firmado(f) && (
                                                            <DropdownMenuItem onClick={() => verInforme(f, "PRELIMINAR")}>
                                                                <FileText size={14} /> Formato preliminar
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => reciboEntrega(f)}>
                                                            <Receipt size={14} /> Recibo de entrega
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        {hasPermission("adjuntos") && (
                                                            <DropdownMenuItem onClick={() => abrirDialogo(f, "adjuntos")}>
                                                                <Paperclip size={14} /> Adjuntos
                                                            </DropdownMenuItem>
                                                        )}
                                                        {hasPermission("adjuntarImagenes") && (
                                                            <DropdownMenuItem onClick={() => abrirDialogo(f, "imagenes")}>
                                                                <Camera size={14} /> Imágenes del estudio
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                if (!firmado(f)) {
                                                                    setError({ titulo: "Enviar Reporte", mensaje: "Debe Seleccionar una Orden Atendida" });
                                                                    return;
                                                                }
                                                                abrirDialogo(f, "correo");
                                                            }}
                                                        >
                                                            <Mail size={14} /> Enviar por correo
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <PaginationControls
                    className="border-t px-3 py-2.5"
                    page={resultado.page}
                    pageSize={resultado.pageSize}
                    total={resultado.total}
                    onPageChange={setPage}
                    opcionesTamano={[10, 20, 30, 50, 100, 200]}
                    onPageSizeChange={(n) => {
                        setPage(1);
                        setPageSize(n);
                    }}
                />

                <p className="flex flex-wrap items-center gap-1.5 border-t px-3 py-2.5 text-[12px]" style={{ borderColor: "var(--border-subtle)", color: "var(--ink-tertiary)" }}>
                    Aquí solo aparecen órdenes atendidas, facturadas o canceladas.
                    <Link
                        href={filtros.q ? `/admisiones/ordenes?q=${encodeURIComponent(filtros.q)}` : "/admisiones/ordenes"}
                        className="font-medium hover:underline"
                        style={{ color: "var(--ink-brand)" }}
                    >
                        {filtros.q ? `Buscar “${filtros.q}” en Órdenes por atender →` : "Ver órdenes pendientes y en proceso →"}
                    </Link>
                </p>
            </Panel>

            <AdjuntosDialog
                open={dialogo === "adjuntos"}
                onOpenChange={(o) => !o && setDialogo(null)}
                idOrden={activa?.orden ?? null}
                titulo={activa ? `${activa.consecutivo} · ${activa.nombre}` : undefined}
            />
            <ImagenesDialog
                open={dialogo === "imagenes"}
                onOpenChange={(o) => !o && setDialogo(null)}
                idOrden={activa?.orden ?? null}
                titulo={activa ? `${activa.consecutivo} · ${activa.nombre}` : undefined}
            />
            <CorreoDialog
                open={dialogo === "correo"}
                onOpenChange={(o) => !o && setDialogo(null)}
                idOrden={activa?.orden ?? null}
                correoPaciente={activa?.correo}
                estudio={activa?.estudio}
                consecutivo={activa?.consecutivo}
            />
            <ErrorDialog open={!!error} onOpenChange={(o) => !o && setError(null)} titulo={error?.titulo} mensaje={error?.mensaje} detalles={error?.detalles} />
        </div>
    );
}

/** Filtro con etiqueta corta a la izquierda, en una sola línea. */
function FiltroCompacto({ etiqueta, children }: { etiqueta: React.ReactNode; children: React.ReactNode }) {
    return (
        <label className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
            <span className="shrink-0">{etiqueta}</span>
            {children}
        </label>
    );
}
