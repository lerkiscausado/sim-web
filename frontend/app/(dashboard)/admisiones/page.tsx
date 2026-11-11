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
import { useTamanoPagina } from "@/lib/useTabla";

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

const ESTADOS = ["PENDIENTE", "PROCESO", "ATENDIDO", "FACTURADO", "CANCELADO"];
const ESTADO_ESTILOS: Record<string, { bg: string; text: string; dot: string }> = {
    PENDIENTE: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
    PROCESO: { bg: "#DBEAFE", text: "#1E40AF", dot: "#2563EB" },
    ATENDIDO: { bg: "#D1FAE5", text: "#065F46", dot: "#059669" },
    CANCELADO: { bg: "#FEE2E2", text: "#991B1B", dot: "#DC2626" },
    FACTURADO: { bg: "#EDE9FE", text: "#5B21B6", dot: "#7C3AED" },
};

function EstadoBadge({ estado }: { estado: string }) {
    const e = ESTADO_ESTILOS[estado] ?? { bg: "#F3F4F6", text: "#374151", dot: "#6B7280" };
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: e.bg, color: e.text }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.dot }} />
            {estado}
        </span>
    );
}

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
    const [pageSize, setPageSize] = useTamanoPagina("consulta-ordenes", 50);
    const [resultado, setResultado] = useState<Resultado>({ data: [], total: 0, page: 1, pageSize: 50 });
    const [cargando, setCargando] = useState(false);
    const [trabajando, setTrabajando] = useState<string | null>(null);
    const [error, setError] = useState<{ titulo: string; mensaje: string; detalles?: string[] } | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
    const [activa, setActiva] = useState<FilaConsulta | null>(null);
    const [dialogo, setDialogo] = useState<"adjuntos" | "imagenes" | "correo" | null>(null);

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
        if (filtros.estado) p.set("estado", filtros.estado);
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

    const hayFiltrosExtra = filtros.fechaInicio || filtros.fechaFin || filtros.estado || filtros.idSede || filtros.idTipoEstudio;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-6 py-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Admisiones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Consultar Órdenes</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        {resultado.total.toLocaleString()} órdenes {filtros.anio ? `en ${filtros.anio}` : "en total"}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={exportarExcel} disabled={!!trabajando}>
                        {trabajando === "excel" ? <Loader2 className="animate-spin" size={14} /> : <FileSpreadsheet size={14} />}
                        Exportar Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPdf} disabled={!!trabajando}>
                        {trabajando === "pdf" ? <Loader2 className="animate-spin" size={14} /> : <FileDown size={14} />}
                        Exportar PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportarPdf} disabled={!!trabajando} title="Abre la grilla en PDF para imprimirla">
                        <Printer size={14} />
                        Imprimir
                    </Button>
                    {hasPermission("imprimir") && (
                        <Button size="sm" onClick={exportarLote} disabled={!!trabajando || resultado.total === 0}>
                            {trabajando === "lote" ? <Loader2 className="animate-spin" size={14} /> : <FileArchive size={14} />}
                            Exportar lote PDF{seleccion.size ? ` (${seleccion.size})` : ""}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Consecutivo, paciente, identificación, espécimen…"
                        className="pl-9"
                        value={filtros.q}
                        onChange={(e) => cambiar("q", e.target.value)}
                    />
                </div>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Año</span>
                    <Select value={filtros.anio} onChange={(e) => cambiar("anio", e.target.value)}>
                        <option value="">Todos</option>
                        {(anios.length ? anios : [anioActual]).map((a) => (
                            <option key={a} value={a}>
                                {a}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Desde</span>
                    <Input type="date" className="h-9 w-auto" value={filtros.fechaInicio} onChange={(e) => cambiar("fechaInicio", e.target.value)} />
                </label>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Hasta</span>
                    <Input type="date" className="h-9 w-auto" value={filtros.fechaFin} onChange={(e) => cambiar("fechaFin", e.target.value)} />
                </label>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Estado</span>
                    <Select value={filtros.estado} onChange={(e) => cambiar("estado", e.target.value)}>
                        <option value="">Todos</option>
                        {ESTADOS.map((e) => (
                            <option key={e} value={e}>
                                {e}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Sede</span>
                    <Select value={filtros.idSede} onChange={(e) => cambiar("idSede", e.target.value)}>
                        <option value="">Todas</option>
                        {sedes.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.nombre}
                            </option>
                        ))}
                    </Select>
                </label>
                <label className="space-y-1 text-[11.5px] font-medium">
                    <span className="block">Estudio</span>
                    <Select value={filtros.idTipoEstudio} onChange={(e) => cambiar("idTipoEstudio", e.target.value)}>
                        <option value="">Todos</option>
                        {tipos.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nombreTipoEstudio}
                            </option>
                        ))}
                    </Select>
                </label>
                {hayFiltrosExtra && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFiltros((f) => ({ ...f, fechaInicio: "", fechaFin: "", estado: "", idSede: "", idTipoEstudio: "" }))}
                    >
                        <X size={14} /> Limpiar
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={cargar} disabled={cargando} className="ml-auto">
                    <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                    Actualizar Vista
                </Button>
            </div>

            {aviso && (
                <p className="flex items-center justify-between rounded-md bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-800">
                    {aviso}
                    <button type="button" onClick={() => setAviso(null)}>
                        <X size={14} />
                    </button>
                </p>
            )}

            <div className="overflow-x-auto rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-8">
                                <input type="checkbox" checked={todasMarcadas} onChange={toggleTodas} aria-label="Marcar todas" />
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5" />
                                    Consecutivo
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
                                    <Building2 className="h-3.5 w-3.5" />
                                    Entidad / Sub entidad
                                </span>
                            </TableHead>
                            <TableHead>
                                <span className="inline-flex items-center gap-1.5">
                                    <TestTube2 className="h-3.5 w-3.5" />
                                    Estudio / Espécimen
                                </span>
                            </TableHead>
                            <TableHead>Sede</TableHead>
                            <TableHead>Comentarios</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
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
                                    No hay órdenes con estos filtros.
                                </TableCell>
                            </TableRow>
                        )}
                        {resultado.data.map((f) => (
                            <TableRow
                                key={f.orden}
                                className={`cursor-pointer align-top ${activa?.orden === f.orden ? "bg-blue-50/70" : "hover:bg-muted/40"}`}
                                onClick={() => setActiva(f)}
                                onDoubleClick={() => verInforme(f)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={seleccion.has(f.orden)} onChange={() => toggle(f.orden)} aria-label={`Marcar ${f.consecutivo}`} />
                                </TableCell>
                                <TableCell className="py-2.5">
                                    <p className="font-bold">{f.consecutivo || f.orden}</p>
                                    <p className="text-xs text-muted-foreground">{fechaCorta(f.fechaIngreso)}</p>
                                </TableCell>
                                <TableCell className="py-2.5">
                                    <p className="font-semibold">{f.nombre}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {f.identificacion} · {f.sexo}
                                        {f.edad !== null ? ` · ${f.edad} años` : ""}
                                        {f.telefono ? ` · ${f.telefono}` : ""}
                                    </p>
                                    {f.correo && <p className="max-w-[220px] truncate text-xs text-muted-foreground">{f.correo}</p>}
                                </TableCell>
                                <TableCell className="py-2.5 text-xs">
                                    <p className="font-medium">{f.entidad}</p>
                                    <p className="text-muted-foreground">{f.subentidad}</p>
                                </TableCell>
                                <TableCell className="max-w-[260px] py-2.5 text-xs">
                                    <p className="font-medium">{f.estudio}</p>
                                    <p className="line-clamp-2 text-muted-foreground">{f.especimen}</p>
                                </TableCell>
                                <TableCell className="py-2.5 text-xs">{f.sede}</TableCell>
                                <TableCell className="max-w-[200px] py-2.5 text-xs text-muted-foreground">
                                    <span className="line-clamp-2">{f.comentarios}</span>
                                </TableCell>
                                <TableCell className="py-2.5 text-center">
                                    <EstadoBadge estado={f.estado} />
                                </TableCell>
                                <TableCell className="py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="inline-flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title={firmado(f) ? "Ver informe" : "Ver informe preliminar"}
                                            onClick={() => verInforme(f)}
                                            disabled={trabajando === `inf-${f.orden}`}
                                        >
                                            {trabajando === `inf-${f.orden}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" title="Más acciones">
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
                        ))}
                    </TableBody>
                </Table>
            </div>

            <PaginationControls
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
