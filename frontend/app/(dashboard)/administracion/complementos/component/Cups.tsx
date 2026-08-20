"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
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
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";

interface CupsItem {
    codigoCups: string;
    nombreCups: string;
    estado: "ACTIVO" | "INACTIVO";
}

interface Paginado {
    data: CupsItem[];
    total: number;
    page: number;
    pageSize: number;
}

export default function Cups() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<CupsItem | null>(null);
    const [form, setForm] = useState({ codigoCups: "", nombreCups: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            const data = await api.get<Paginado>(`/catalogos/cups?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo CUPS");
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
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

    function abrirNuevo() {
        setEditando(null);
        setForm({ codigoCups: "", nombreCups: "" });
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(item: CupsItem) {
        setEditando(item);
        setForm({ codigoCups: item.codigoCups, nombreCups: item.nombreCups });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.codigoCups || !form.nombreCups) {
            setFormError("Código y nombre son obligatorios.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/catalogos/cups/${editando.codigoCups}`, { nombreCups: form.nombreCups });
            } else {
                await api.post("/catalogos/cups", form);
            }
            setDialogOpen(false);
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: CupsItem) {
        const nuevo = item.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        try {
            await api.patch(`/catalogos/cups/${item.codigoCups}/estado/${nuevo}`);
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
                        <CardTitle className="text-xl font-bold">Catálogo CUPS</CardTitle>
                        <CardDescription>
                            Búsqueda y gestión de la Clasificación Única de Procedimientos en Salud.
                        </CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={abrirNuevo}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Código
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
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[120px] font-bold">Código</TableHead>
                                <TableHead className="font-bold">Descripción</TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
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
                                <TableRow key={item.codigoCups} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-primary">{item.codigoCups}</TableCell>
                                    <TableCell className="max-w-md truncate">{item.nombreCups}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={`font-medium ${item.estado === "ACTIVO" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                            variant={item.estado === "ACTIVO" ? "default" : "destructive"}
                                        >
                                            {item.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => abrirEditar(item)}>
                                            Editar
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => toggleEstado(item)}>
                                            {item.estado === "ACTIVO" ? "Desactivar" : "Activar"}
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
                        <DialogTitle>{editando ? "Editar código CUPS" : "Nuevo código CUPS"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Código</label>
                            <Input
                                value={form.codigoCups}
                                disabled={!!editando}
                                onChange={(e) => setForm((f) => ({ ...f, codigoCups: e.target.value }))}
                                maxLength={12}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción</label>
                            <Input
                                value={form.nombreCups}
                                onChange={(e) => setForm((f) => ({ ...f, nombreCups: e.target.value }))}
                                maxLength={300}
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
