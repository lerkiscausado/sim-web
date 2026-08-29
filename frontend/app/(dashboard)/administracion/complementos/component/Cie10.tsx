"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2, Pencil, Hash, FileText, Ban, CheckCircle2 } from "lucide-react";
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

interface Cie10Item {
    codigoDiagnostico: string;
    nombreDiagnostico: string | null;
    estado: string | null;
}

interface Paginado {
    data: Cie10Item[];
    total: number;
    page: number;
    pageSize: number;
}

export default function Cie10() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Cie10Item | null>(null);
    const [form, setForm] = useState({ codigoDiagnostico: "", nombreDiagnostico: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string, estado?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            if (estado) qs.set("estado", estado);
            const data = await api.get<Paginado>(`/catalogos/diagnosticos?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo CIE10");
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
        setForm({ codigoDiagnostico: "", nombreDiagnostico: "" });
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(item: Cie10Item) {
        setEditando(item);
        setForm({ codigoDiagnostico: item.codigoDiagnostico, nombreDiagnostico: item.nombreDiagnostico ?? "" });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.codigoDiagnostico) {
            setFormError("El código es obligatorio.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/catalogos/diagnosticos/${editando.codigoDiagnostico}`, {
                    nombreDiagnostico: form.nombreDiagnostico,
                });
            } else {
                await api.post("/catalogos/diagnosticos", form);
            }
            setDialogOpen(false);
            await cargar(page, searchTerm, filtroEstado);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: Cie10Item) {
        const nuevo = item.estado === "A" ? "I" : "A";
        try {
            await api.patch(`/catalogos/diagnosticos/${item.codigoDiagnostico}/estado/${nuevo}`);
            await cargar(page, searchTerm, filtroEstado);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Catálogo CIE10</CardTitle>
                        <CardDescription>
                            Búsqueda y consulta de la Clasificación Internacional de Enfermedades (10ª Versión).
                        </CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={abrirNuevo}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Diagnóstico
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código o descripción..."
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
                                <TableHead className="w-[120px] font-bold"><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Código</span></TableHead>
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Descripción</span></TableHead>
                                <TableHead className="w-[100px] text-center font-bold">Estado</TableHead>
                                <TableHead className="w-[140px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && (!result || result.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {result?.data.map((item) => (
                                <TableRow key={item.codigoDiagnostico} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-primary">{item.codigoDiagnostico}</TableCell>
                                    <TableCell className="max-w-md truncate">{item.nombreDiagnostico ?? "—"}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={item.estado === "A" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}
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
                        <DialogTitle>{editando ? "Editar Diagnóstico" : "Nuevo Diagnóstico CIE10"}</DialogTitle>
                        <DialogDescription>{editando ? "Actualiza la descripción de este diagnóstico." : "Registra un nuevo código CIE10 en el catálogo."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Código</label>
                            <Input
                                value={form.codigoDiagnostico}
                                disabled={!!editando}
                                onChange={(e) => setForm((f) => ({ ...f, codigoDiagnostico: e.target.value.toUpperCase() }))}
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción</label>
                            <Input
                                value={form.nombreDiagnostico}
                                onChange={(e) => setForm((f) => ({ ...f, nombreDiagnostico: e.target.value }))}
                                maxLength={900}
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
