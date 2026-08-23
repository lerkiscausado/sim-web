"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2, DollarSign, Pencil, Ban, CheckCircle2, ListTree } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { DetalleTarifaView } from "./DetalleTarifaView";

interface TarifaItem {
    id: number;
    nombreTarifa: string;
    estado: "A" | "I";
}

interface Paginado {
    data: TarifaItem[];
    total: number;
    page: number;
    pageSize: number;
}

export default function TarifasPage() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [detalleAbierto, setDetalleAbierto] = useState<TarifaItem | null>(null);
    const [editando, setEditando] = useState<TarifaItem | null>(null);
    const [form, setForm] = useState({ nombreTarifa: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            const data = await api.get<Paginado>(`/entidades-contratos/tarifas?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de tarifas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar(1);
    }, [cargar]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

    function abrirNuevo() {
        setEditando(null);
        setForm({ nombreTarifa: "" });
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(item: TarifaItem) {
        setEditando(item);
        setForm({ nombreTarifa: item.nombreTarifa });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.nombreTarifa) {
            setFormError("El nombre es obligatorio.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/entidades-contratos/tarifas/${editando.id}`, form);
            } else {
                await api.post("/entidades-contratos/tarifas", form);
            }
            setDialogOpen(false);
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la tarifa");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: TarifaItem) {
        const nuevo = item.estado === "A" ? "I" : "A";
        try {
            await api.patch(`/entidades-contratos/tarifas/${item.id}/estado/${nuevo}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    return detalleAbierto ? (
        <DetalleTarifaView
            idTarifa={detalleAbierto.id}
            nombreTarifa={detalleAbierto.nombreTarifa}
            onVolver={() => {
                setDetalleAbierto(null);
                cargar(page, searchTerm);
            }}
        />
    ) : (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Administración
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Tarifas</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Gestión de tarifas para la facturación de contratos
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Tarifa
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="font-bold">
                                <span className="inline-flex items-center gap-1.5">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    Nombre
                                </span>
                            </TableHead>
                            <TableHead className="w-[100px] text-center font-bold">Estado</TableHead>
                            <TableHead className="w-[140px] text-right font-bold">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && (!result || result.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                    No se encontraron tarifas.
                                </TableCell>
                            </TableRow>
                        )}
                        {result?.data.map((item) => (
                            <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-semibold">{item.nombreTarifa}</TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        className={`font-medium ${item.estado === "A" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                        variant={item.estado === "A" ? "default" : "destructive"}
                                    >
                                        {item.estado === "A" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 px-2" title="Ver Detalle" onClick={() => setDetalleAbierto(item)}>
                                        <ListTree className="h-3.5 w-3.5" style={{ color: "#2563EB" }} />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-8 px-2" title="Editar" onClick={() => abrirEditar(item)}>
                                        <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2"
                                        title={item.estado === "A" ? "Desactivar" : "Activar"}
                                        onClick={() => toggleEstado(item)}
                                    >
                                        {item.estado === "A" ? (
                                            <Ban className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                        ) : (
                                            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#059669" }} />
                                        )}
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Tarifa" : "Nueva Tarifa"}</DialogTitle>
                        <DialogDescription>
                            {editando ? "Actualiza el nombre de la tarifa." : "Registra una nueva tarifa para asociar a contratos."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nombre</label>
                            <Input
                                value={form.nombreTarifa}
                                onChange={(e) => setForm({ nombreTarifa: e.target.value })}
                                maxLength={200}
                            />
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
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
