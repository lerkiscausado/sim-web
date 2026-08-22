"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";

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
    estado: "ACTIVO" | "INACTIVO";
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
        });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.codigoEntidad || !form.nombre || !form.fechaFinal || !form.usuario) {
            setFormError("Entidad, nombre, fecha final y usuario son obligatorios.");
            return;
        }
        if (!editando && !form.contrasena) {
            setFormError("La contraseña es obligatoria para un contrato nuevo.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                const payload: Partial<typeof form> = { ...form };
                if (!payload.contrasena) delete payload.contrasena;
                await api.patch(`/entidades-contratos/contratos/${editando.id}`, payload);
            } else {
                await api.post("/entidades-contratos/contratos", form);
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
        const nuevo = c.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        try {
            await api.patch(`/entidades-contratos/contratos/${c.id}/estado/${nuevo}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
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
                        <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Entidad</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Vigencia</TableHead>
                            <TableHead>Tarifa</TableHead>
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
                                        className={`font-medium ${c.estado === "ACTIVO" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                        variant={c.estado === "ACTIVO" ? "default" : "destructive"}
                                    >
                                        {c.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}>
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => toggleEstado(c)}>
                                        {c.estado === "ACTIVO" ? "Desactivar" : "Activar"}
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
                        <DialogTitle>{editando ? "Editar contrato" : "Nuevo contrato"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Entidad</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.codigoEntidad}
                                onChange={(e) => setForm((f) => ({ ...f, codigoEntidad: e.target.value }))}
                            >
                                <option value="">Seleccionar…</option>
                                {entidades.map((e) => (
                                    <option key={e.codigoEntidad} value={e.codigoEntidad}>
                                        {e.nombreEntidad}
                                    </option>
                                ))}
                            </select>
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
                            <Input
                                type="password"
                                value={form.contrasena}
                                onChange={(e) => setForm((f) => ({ ...f, contrasena: e.target.value }))}
                            />
                        </div>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    <DialogFooter>
                        <Button onClick={guardar} disabled={guardando}>
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
