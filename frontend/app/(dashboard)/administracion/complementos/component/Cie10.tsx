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

interface Cie10Item {
    codigoDiagnostico: string;
    nombreDiagnostico: string | null;
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
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Cie10Item | null>(null);
    const [form, setForm] = useState({ codigoDiagnostico: "", nombreDiagnostico: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
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
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
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
                                <TableHead className="w-[100px] text-right font-bold">Acciones</TableHead>
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
                                <TableRow key={item.codigoDiagnostico} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-primary">{item.codigoDiagnostico}</TableCell>
                                    <TableCell className="max-w-md truncate">{item.nombreDiagnostico ?? "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => abrirEditar(item)}>
                                            Editar
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
                        <DialogTitle>{editando ? "Editar diagnóstico" : "Nuevo diagnóstico CIE10"}</DialogTitle>
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
