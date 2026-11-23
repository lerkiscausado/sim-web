"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Send, Eye, Copy, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pildora, type Tono } from "@/components/ui/panel";
import { useFeedback } from "@/components/ui/feedback";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePaginacionLocal } from "@/lib/useTabla";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { hoyISO } from "@/lib/fechas";

interface Envio {
    id: number;
    fechaEnvio: string;
    tipoDocumento: string;
    documento: string;
    estado: "OK" | "ERROR" | "CORREGIDO";
    codigoHttp: number | null;
    idOrden: number;
    consecutivo: string | null;
    compositionId: string | null;
    paciente: string | null;
    documentoPaciente: string | null;
    resultado: string;
    queHacer: string;
    reenviable: boolean;
}

interface Pendiente {
    origen: string;
    idOrden: number;
    idDetalleOrden: number;
    fechaFirma: string;
    consecutivo: string | null;
    paciente: string | null;
    documento: string | null;
    intentos: string | number;
}

const ESTADO: Record<Envio["estado"], { tono: Tono; texto: string }> = {
    OK: { tono: "exito", texto: "Aceptado" },
    ERROR: { tono: "marca", texto: "Error" },
    CORREGIDO: { tono: "neutro", texto: "Corregido después" },
};

const fecha = (v: string) => new Date(v).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

function desdePeriodo(p: string) {
    const d = new Date();
    if (p === "hoy") return hoyISO();
    if (p === "7") d.setDate(d.getDate() - 6);
    else if (p === "30") d.setDate(d.getDate() - 29);
    else return "";
    return d.toISOString().slice(0, 10);
}

/** Configuración → Historial RDA (frmHistorialRDA del escritorio): pensado para usuarios no técnicos. */
export default function HistorialRdaPage() {
    const { avisar, confirmar } = useFeedback();
    const [vista, setVista] = useState<"envios" | "pendientes">("envios");
    const [periodo, setPeriodo] = useState("30");
    const [estado, setEstado] = useState("");
    const [q, setQ] = useState("");
    const [datos, setDatos] = useState<{ resumen: Record<string, number>; envios: Envio[] } | null>(null);
    const [pendientes, setPendientes] = useState<Pendiente[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState<string | null>(null);
    const [detalle, setDetalle] = useState<{ envio: Envio; tecnico: { detalle: string; bundle?: string | null } | null } | null>(null);
    const tabla = usePaginacionLocal(datos?.envios ?? [], "historial-rda");

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const p = new URLSearchParams();
            const desde = desdePeriodo(periodo);
            if (desde) p.set("desde", desde);
            if (estado) p.set("estado", estado);
            if (q.trim()) p.set("q", q.trim());
            const [h, pen] = await Promise.all([
                api.get<{ resumen: Record<string, number>; envios: Envio[] }>(`/interoperabilidad/rda/historial?${p}`),
                api.get<Pendiente[]>("/interoperabilidad/rda/pendientes"),
            ]);
            setDatos(h);
            setPendientes(pen);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial");
        } finally {
            setCargando(false);
        }
    }, [periodo, estado, q]);

    useEffect(() => {
        const t = setTimeout(cargar, 300);
        return () => clearTimeout(t);
    }, [cargar]);

    async function reenviar(e: Envio) {
        if (!(await confirmar({ titulo: "¿Reenviar a MinSalud?", mensaje: `${e.documento} de la orden ${e.consecutivo ?? e.idOrden}.`, textoAceptar: "Reenviar" }))) return;
        setEnviando(`e${e.id}`);
        try {
            const r = await api.post<{ exitoso: boolean; mensaje: string }>(`/interoperabilidad/rda/envios/${e.id}/reenviar`);
            (r.exitoso ? avisar.exito : avisar.error)(r.mensaje);
            await cargar();
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo reenviar");
        } finally {
            setEnviando(null);
        }
    }

    async function enviarPendiente(p: Pendiente) {
        setEnviando(`p${p.idDetalleOrden}`);
        try {
            const r = await api.post<{ exitoso: boolean; mensaje: string }>(`/interoperabilidad/rda/ordenes/${p.idOrden}/enviar?idDetalleOrden=${p.idDetalleOrden}`);
            (r.exitoso ? avisar.exito : avisar.error)(r.mensaje);
            await cargar();
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo enviar");
        } finally {
            setEnviando(null);
        }
    }

    async function verDetalle(e: Envio) {
        setDetalle({ envio: e, tecnico: null });
        try {
            setDetalle({ envio: e, tecnico: await api.get(`/interoperabilidad/rda/envios/${e.id}`) });
        } catch {
            setDetalle({ envio: e, tecnico: { detalle: "No se pudo cargar la respuesta técnica." } });
        }
    }

    const formatear = (t?: string | null) => {
        if (!t) return "";
        try {
            return JSON.stringify(JSON.parse(t), null, 2);
        } catch {
            return t;
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between encabezado-modulo">
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>Configuración</span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Historial RDA</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Documentos enviados a MinSalud, por qué fallaron y qué hacer.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={cargar} disabled={cargando}>
                    <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && <p className="rounded-md px-4 py-2.5 text-[13px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>{error}</p>}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                    ["Envíos", datos?.resumen.total ?? 0, "var(--ink-primary)"],
                    ["Aceptados", datos?.resumen.aceptados ?? 0, "#15803d"],
                    ["Errores por resolver", datos?.resumen.errores ?? 0, "#b91c1c"],
                    ["Firmados sin RDA", pendientes.length, "#b45309"],
                ].map(([t, n, c]) => (
                    <div key={t as string} className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                        <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>{t}</p>
                        <p className="text-2xl font-bold" style={{ color: c as string }}>{n}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-default)" }}>
                {([["envios", "Envíos"], ["pendientes", `Firmados sin RDA (${pendientes.length})`]] as const).map(([v, t]) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setVista(v)}
                        className="-mb-px border-b-2 px-3 py-2 text-[13px] font-medium"
                        style={{ borderColor: vista === v ? "var(--ink-brand, #e5322b)" : "transparent", color: vista === v ? "var(--ink-primary)" : "var(--ink-secondary)" }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {vista === "envios" ? (
                <>
                    <div className="flex flex-wrap gap-2">
                        <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                            <option value="hoy">Hoy</option>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="todo">Todo</option>
                        </Select>
                        <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                            <option value="">Todos los estados</option>
                            <option value="OK">Aceptados</option>
                            <option value="ERROR">Errores por resolver</option>
                            <option value="CORREGIDO">Corregidos / avisos</option>
                        </Select>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" placeholder="Paciente, documento u orden…" value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>
                    </div>

                    <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Paciente / Orden</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Qué pasó y qué hacer</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!cargando && (datos?.envios.length ?? 0) === 0 && (
                                    <TableRow><TableCell colSpan={6} className="py-8 text-center text-[13px]">No hay envíos en este periodo.</TableCell></TableRow>
                                )}
                                {tabla.visibles.map((e) => (
                                    <TableRow key={e.id} className="align-top">
                                        <TableCell className="whitespace-nowrap text-xs">{fecha(e.fechaEnvio)}</TableCell>
                                        <TableCell className="text-xs">{e.documento}</TableCell>
                                        <TableCell className="whitespace-normal text-xs">
                                            <p className="font-semibold">{e.paciente ?? "—"}</p>
                                            <p className="text-muted-foreground">{e.documentoPaciente} · Orden {e.consecutivo ?? e.idOrden}</p>
                                        </TableCell>
                                        <TableCell><Pildora tono={ESTADO[e.estado].tono}>{ESTADO[e.estado].texto}</Pildora></TableCell>
                                        <TableCell className="min-w-[280px] max-w-md whitespace-normal text-xs">
                                            <p>{e.resultado}</p>
                                            <p className="mt-0.5 text-muted-foreground">{e.queHacer}</p>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-right">
                                            {e.compositionId && (
                                                <Button variant="ghost" size="sm" title="Copiar id del documento en MinSalud" onClick={() => { navigator.clipboard?.writeText(e.compositionId!); avisar.info("Id copiado."); }}>
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" title="Respuesta técnica" onClick={() => verDetalle(e)}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            {e.estado === "ERROR" && (
                                                <Button size="sm" variant="outline" onClick={() => reenviar(e)} disabled={!!enviando}>
                                                    {enviando === `e${e.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                    Reenviar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <PaginationControls {...tabla.paginacion} />
                </>
            ) : (
                <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                    <p className="border-b px-4 py-3 text-[12.5px]" style={{ borderColor: "var(--border-default)", color: "var(--ink-secondary)" }}>
                        Historias y estudios firmados en la web (últimos 60 días) sin un RDA de la atención aceptado. Pasa si se cortó la conexión o el servidor se reinició durante el envío.
                    </p>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead>Firmado</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead>Paciente / Orden</TableHead>
                                <TableHead>Intentos</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendientes.length === 0 && (
                                <TableRow><TableCell colSpan={5} className="py-8 text-center text-[13px]">Todo lo firmado tiene su RDA.</TableCell></TableRow>
                            )}
                            {pendientes.map((p) => (
                                <TableRow key={`${p.origen}-${p.idDetalleOrden}`}>
                                    <TableCell className="whitespace-nowrap text-xs">{fecha(p.fechaFirma)}</TableCell>
                                    <TableCell className="text-xs">{p.origen}</TableCell>
                                    <TableCell className="text-xs">
                                        <p className="font-semibold">{p.paciente ?? "—"}</p>
                                        <p className="text-muted-foreground">{p.documento} · Orden {p.consecutivo ?? p.idOrden}</p>
                                    </TableCell>
                                    <TableCell className="text-xs">{p.intentos}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => enviarPendiente(p)} disabled={!!enviando}>
                                            {enviando === `p${p.idDetalleOrden}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            Enviar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Respuesta técnica — {detalle?.envio.documento}</DialogTitle>
                        <DialogDescription>
                            HTTP {detalle?.envio.codigoHttp ?? "—"} · {detalle && fecha(detalle.envio.fechaEnvio)}
                            {detalle?.envio.compositionId ? ` · Id MinSalud ${detalle.envio.compositionId}` : ""}
                        </DialogDescription>
                    </DialogHeader>
                    {!detalle?.tecnico ? (
                        <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    ) : (
                        <div className="space-y-3">
                            <p className="text-[12px] font-semibold">Respuesta de MinSalud</p>
                            <pre className="max-h-72 overflow-auto rounded-md bg-muted/40 p-3 text-[11px]">{formatear(detalle.tecnico.detalle)}</pre>
                            {detalle.tecnico.bundle && (
                                <>
                                    <p className="text-[12px] font-semibold">Documento enviado (sin el PDF)</p>
                                    <pre className="max-h-72 overflow-auto rounded-md bg-muted/40 p-3 text-[11px]">{formatear(detalle.tecnico.bundle)}</pre>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
