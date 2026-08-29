"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Plus, Loader2, Pencil, Ban, CheckCircle2, FileText, Building2, Tag, CalendarDays, DollarSign, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { getPreferencias } from "@/lib/preferencias";

interface Entidad {
    codigoEntidad: string;
    nombreEntidad: string;
}

interface Tarifa {
    id: number;
    nombreTarifa: string;
}

interface Contrato {
    id: number;
    codigoEntidad: string;
    nombre: string;
    numeroContrato: string | null;
    fechaInicio: string | null;
    fechaFinal: string;
    tipoContrato: "EVENTO" | "CAPITADO" | "PAQUETE";
    rips: "SI" | "NO";
    idTarifa: number | null;
    valorConvenio: number | null;
    idLicencia: number;
    usuario: string;
    contrasena: string;
    estado: "A" | "I";
    entidad?: Entidad;
    tarifa?: Tarifa;
}

const FORM_INICIAL = {
    codigoEntidad: "",
    nombre: "",
    numeroContrato: "",
    fechaInicio: "",
    fechaFinal: "",
    tipoContrato: "EVENTO",
    rips: "NO",
    idTarifa: undefined as number | undefined,
    valorConvenio: undefined as number | undefined,
    idLicencia: 1,
    usuario: "",
    contrasena: "",
    confirmarContrasena: "",
};

interface Paginado {
    data: Contrato[];
    total: number;
    page: number;
    pageSize: number;
}

export default function ContratosPage() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [entidades, setEntidades] = useState<Entidad[]>([]);
    const [tarifas, setTarifas] = useState<Tarifa[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Contrato | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false);
    const [contratoAEliminar, setContratoAEliminar] = useState<Contrato | null>(null);
    const [eliminando, setEliminando] = useState(false);
    const [entidadQuery, setEntidadQuery] = useState("");
    const [entidadResultadosAbiertos, setEntidadResultadosAbiertos] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            const [contratosData, entidadesData, tarifasData] = await Promise.all([
                api.get<Paginado>(`/entidades-contratos/contratos?${qs.toString()}`),
                api.get<Entidad[]>("/entidades-contratos/entidades/activas"),
                api.get<Tarifa[]>("/entidades-contratos/tarifas"),
            ]);
            setResult(contratosData);
            setEntidades(entidadesData);
            setTarifas(tarifasData);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de contratos");
        } finally {
            setLoading(false);
        }
    }, []);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

    useEffect(() => {
        cargar(1);
    }, [cargar]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function abrirNuevo() {
        setEditando(null);
        setForm(FORM_INICIAL);
        setFormError(null);
        setMostrarContrasena(false);
        setMostrarConfirmarContrasena(false);
        setEntidadQuery("");
        setDialogOpen(true);
    }

    function abrirEditar(c: Contrato) {
        setEditando(c);
        setForm({
            codigoEntidad: c.codigoEntidad,
            nombre: c.nombre,
            numeroContrato: c.numeroContrato ?? "",
            fechaInicio: c.fechaInicio ?? "",
            fechaFinal: c.fechaFinal,
            tipoContrato: c.tipoContrato,
            rips: c.rips,
            idTarifa: c.idTarifa ?? undefined,
            valorConvenio: c.valorConvenio ?? undefined,
            idLicencia: c.idLicencia,
            usuario: c.usuario,
            contrasena: "",
            confirmarContrasena: "",
        });
        setFormError(null);
        setMostrarContrasena(false);
        setMostrarConfirmarContrasena(false);
        setEntidadQuery(c.entidad ? `${c.codigoEntidad} - ${c.entidad.nombreEntidad}` : c.codigoEntidad);
        setDialogOpen(true);
    }

    const entidadesFiltradas = useMemo(() => {
        const q = entidadQuery.trim().toLowerCase();
        if (q.length < 3) return [];
        return entidades.filter(
            (e) => e.nombreEntidad.toLowerCase().includes(q) || e.codigoEntidad.toLowerCase().includes(q),
        );
    }, [entidades, entidadQuery]);

    async function guardar() {
        if (!form.codigoEntidad || !form.nombre || !form.fechaFinal || !form.usuario) {
            setFormError("Entidad, nombre, fecha final y usuario son obligatorios.");
            return;
        }
        if (!editando && !form.contrasena) {
            setFormError("La contraseña es obligatoria para un contrato nuevo.");
            return;
        }
        if (form.contrasena && form.contrasena !== form.confirmarContrasena) {
            setFormError("Las contraseñas no coinciden.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { confirmarContrasena, ...resto } = form;
                const payload: Partial<typeof resto> = { ...resto };
                if (!payload.contrasena) delete payload.contrasena;
                await api.patch(`/entidades-contratos/contratos/${editando.id}`, payload);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { confirmarContrasena, ...payload } = form;
                await api.post("/entidades-contratos/contratos", payload);
            }
            setDialogOpen(false);
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el contrato");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(c: Contrato) {
        const nuevo = c.estado === "A" ? "I" : "A";
        try {
            await api.patch(`/entidades-contratos/contratos/${c.id}/estado/${nuevo}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    async function eliminar(c: Contrato) {
        if (!getPreferencias().confirmarEliminar) {
            await confirmarEliminarInmediato(c);
            return;
        }
        setContratoAEliminar(c);
    }

    async function confirmarEliminarInmediato(c: Contrato) {
        setEliminando(true);
        try {
            await api.delete(`/entidades-contratos/contratos/${c.id}`);
            setContratoAEliminar(null);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo eliminar el contrato");
            setContratoAEliminar(null);
        } finally {
            setEliminando(false);
        }
    }

    async function confirmarEliminar() {
        if (!contratoAEliminar) return;
        setEliminando(true);
        try {
            await api.delete(`/entidades-contratos/contratos/${contratoAEliminar.id}`);
            setContratoAEliminar(null);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo eliminar el contrato");
            setContratoAEliminar(null);
        } finally {
            setEliminando(false);
        }
    }

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Administración
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Contratos</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Contratos con entidades y aseguradoras
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo contrato
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, número o entidad..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Contrato</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Entidad</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />Tipo</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Vigencia</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />Tarifa</span></TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && (!result || result.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                                    No se encontraron contratos.
                                </TableCell>
                            </TableRow>
                        )}
                        {result?.data.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">
                                    {c.nombre}
                                    {c.numeroContrato && (
                                        <span className="ml-2 text-xs text-muted-foreground">#{c.numeroContrato}</span>
                                    )}
                                </TableCell>
                                <TableCell>{c.entidad?.nombreEntidad ?? c.codigoEntidad}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{c.tipoContrato}</Badge>
                                </TableCell>
                                <TableCell className="text-xs">
                                    {c.fechaInicio ?? "—"} → {c.fechaFinal}
                                </TableCell>
                                <TableCell>{c.tarifa?.nombreTarifa ?? "—"}</TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        className={`font-medium ${c.estado === "A" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                        variant={c.estado === "A" ? "default" : "destructive"}
                                    >
                                        {c.estado === "A" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirEditar(c)}>
                                        <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        title={c.estado === "A" ? "Desactivar" : "Activar"}
                                        onClick={() => toggleEstado(c)}
                                    >
                                        {c.estado === "A" ? (
                                            <Ban className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                        ) : (
                                            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#059669" }} />
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Eliminar" onClick={() => eliminar(c)}>
                                        <Trash2 className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {result && (
                <PaginationControls page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={cambiarPagina} />
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Contrato" : "Nuevo Contrato"}</DialogTitle>
                        <DialogDescription>{editando ? "Actualiza los datos y la tarifa del contrato." : "Registra un nuevo contrato con una entidad."}</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="relative space-y-1.5">
                            <label className="text-[12.5px] font-medium">Entidad</label>
                            <Input
                                placeholder="Escribe al menos 3 letras…"
                                value={entidadQuery}
                                onChange={(e) => {
                                    setEntidadQuery(e.target.value);
                                    setEntidadResultadosAbiertos(true);
                                    if (!e.target.value) setForm((f) => ({ ...f, codigoEntidad: "" }));
                                }}
                                onFocus={() => setEntidadResultadosAbiertos(true)}
                                onBlur={() => setTimeout(() => setEntidadResultadosAbiertos(false), 150)}
                            />
                            {entidadResultadosAbiertos && entidadesFiltradas.length > 0 && (
                                <div
                                    className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                                    style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                >
                                    {entidadesFiltradas.map((e) => (
                                        <button
                                            key={e.codigoEntidad}
                                            type="button"
                                            className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                            onClick={() => {
                                                setForm((f) => ({ ...f, codigoEntidad: e.codigoEntidad }));
                                                setEntidadQuery(`${e.codigoEntidad} - ${e.nombreEntidad}`);
                                                setEntidadResultadosAbiertos(false);
                                            }}
                                        >
                                            {e.codigoEntidad} - {e.nombreEntidad}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nombre del contrato</label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Número de contrato</label>
                            <Input
                                value={form.numeroContrato}
                                onChange={(e) => setForm((f) => ({ ...f, numeroContrato: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Tipo de contrato</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.tipoContrato}
                                onChange={(e) => setForm((f) => ({ ...f, tipoContrato: e.target.value }))}
                            >
                                <option value="EVENTO">Evento</option>
                                <option value="CAPITADO">Capitado</option>
                                <option value="PAQUETE">Paquete</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Fecha inicio</label>
                            <Input
                                type="date"
                                value={form.fechaInicio}
                                onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Fecha final</label>
                            <Input
                                type="date"
                                value={form.fechaFinal}
                                onChange={(e) => setForm((f) => ({ ...f, fechaFinal: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Tarifa aplicada</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.idTarifa ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, idTarifa: Number(e.target.value) || undefined }))}
                            >
                                <option value="">Sin tarifa</option>
                                {tarifas.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombreTarifa}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">¿Genera RIPS?</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.rips}
                                onChange={(e) => setForm((f) => ({ ...f, rips: e.target.value }))}
                            >
                                <option value="NO">No</option>
                                <option value="SI">Sí</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Usuario portal externo</label>
                            <Input
                                value={form.usuario}
                                onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">
                                {editando ? "Nueva contraseña (opcional)" : "Contraseña"}
                            </label>
                            <div className="relative">
                                <Input
                                    type={mostrarContrasena ? "text" : "password"}
                                    className="pr-9"
                                    value={form.contrasena}
                                    onChange={(e) => setForm((f) => ({ ...f, contrasena: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarContrasena((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {mostrarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">
                                {editando ? "Repetir nueva contraseña" : "Repetir contraseña"}
                            </label>
                            <div className="relative">
                                <Input
                                    type={mostrarConfirmarContrasena ? "text" : "password"}
                                    className="pr-9"
                                    value={form.confirmarContrasena}
                                    onChange={(e) => setForm((f) => ({ ...f, confirmarContrasena: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarConfirmarContrasena((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {mostrarConfirmarContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {formError && (
                        <p
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px]"
                            style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {formError}
                        </p>
                    )}
                    <DialogFooter>
                        <Button onClick={guardar} disabled={guardando}>
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!contratoAEliminar} onOpenChange={(open) => !open && setContratoAEliminar(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle className="text-center">Eliminar Contrato</DialogTitle>
                        <DialogDescription className="text-center">
                            Esta acción no se puede deshacer desde la aplicación. Revisa los datos antes de confirmar.
                        </DialogDescription>
                    </DialogHeader>

                    {contratoAEliminar && (
                        <div
                            className="space-y-2 rounded-md border px-4 py-3 text-[13px]"
                            style={{ borderColor: "var(--border-default)", background: "var(--surface-sunken, #f9fafb)" }}
                        >
                            <p>
                                <span className="font-medium">Contrato:</span> {contratoAEliminar.nombre}
                            </p>
                            <p>
                                <span className="font-medium">Entidad:</span>{" "}
                                {contratoAEliminar.entidad?.nombreEntidad ?? contratoAEliminar.codigoEntidad}
                            </p>
                            {contratoAEliminar.numeroContrato && (
                                <p>
                                    <span className="font-medium">Número:</span> {contratoAEliminar.numeroContrato}
                                </p>
                            )}
                            <p>
                                <span className="font-medium">Tipo:</span> {contratoAEliminar.tipoContrato}
                            </p>
                            <p>
                                <span className="font-medium">Fecha final:</span> {contratoAEliminar.fechaFinal}
                            </p>
                        </div>
                    )}

                    <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Se marcará como eliminado, pero podrá recuperarse directamente en la base de datos si es necesario.
                    </p>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setContratoAEliminar(null)} disabled={eliminando}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmarEliminar} disabled={eliminando}>
                            {eliminando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
