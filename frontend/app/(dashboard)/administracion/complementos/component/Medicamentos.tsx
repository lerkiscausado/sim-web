"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2, Pencil, Ban, CheckCircle2, Pill } from "lucide-react";
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";

interface MedicamentoItem {
    id: number;
    nombre: string;
    estado: "A" | "I";
}

interface Paginado {
    data: MedicamentoItem[];
    total: number;
    page: number;
    pageSize: number;
}

export default function Medicamentos() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<MedicamentoItem | null>(null);
    const [form, setForm] = useState({ nombre: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string, estado?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            if (estado) qs.set("estado", estado);
            const data = await api.get<Paginado>(`/catalogos/medicamentos?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo de medicamentos");
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
            cargar(1, searchTerm, filtroEstado);
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm, filtroEstado, cargar]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm, filtroEstado);
    }

    function abrirNuevo() {
        setEditando(null);
        setForm({ nombre: "" });
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(item: MedicamentoItem) {
        setEditando(item);
        setForm({ nombre: item.nombre });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.nombre) {
            setFormError("El nombre es obligatorio.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/catalogos/medicamentos/${editando.id}`, form);
            } else {
                await api.post("/catalogos/medicamentos", form);
            }
            setDialogOpen(false);
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: MedicamentoItem) {
        const nuevo = item.estado === "A" ? "I" : "A";
        try {
            await api.patch(`/catalogos/medicamentos/${item.id}/estado/${nuevo}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Catálogo de Medicamentos</CardTitle>
                        <CardDescription>Gestión y consulta del vademécum institucional.</CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={abrirNuevo}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Medicamento
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-9 rounded-md border bg-transparent px-3 text-sm"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        <option value="A">Activos</option>
                        <option value="I">Inactivos</option>
                    </select>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><Pill className="h-3.5 w-3.5" />Nombre</span></TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[140px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && (!result || result.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {result?.data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-semibold">{item.nombre}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={`font-medium ${item.estado === "A" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                            variant={item.estado === "A" ? "default" : "destructive"}
                                        >
                                            {item.estado === "A" ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
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
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Medicamento" : "Nuevo Medicamento"}</DialogTitle>
                        <DialogDescription>{editando ? "Actualiza el nombre del medicamento." : "Registra un nuevo medicamento en el catálogo."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nombre</label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm({ nombre: e.target.value })}
                                maxLength={50}
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
        </Card>
    );
}
