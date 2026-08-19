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

interface EntidadItem {
    codigoEntidad: string;
    nombreEntidad: string;
    nit: string | null;
    direccion: string | null;
    telefono: string | null;
    estado: "ACTIVO" | "INACTIVO";
}

const FORM_INICIAL = { codigoEntidad: "", nombreEntidad: "", nit: "", direccion: "", telefono: "" };

export default function Entidades() {
    const [items, setItems] = useState<EntidadItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<EntidadItem | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const data = await api.get<EntidadItem[]>(`/entidades-contratos/entidades${qs}`);
            setItems(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar el catálogo de entidades");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    useEffect(() => {
        const t = setTimeout(() => cargar(searchTerm), 300);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function abrirNuevo() {
        setEditando(null);
        setForm(FORM_INICIAL);
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(item: EntidadItem) {
        setEditando(item);
        setForm({
            codigoEntidad: item.codigoEntidad,
            nombreEntidad: item.nombreEntidad,
            nit: item.nit ?? "",
            direccion: item.direccion ?? "",
            telefono: item.telefono ?? "",
        });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.codigoEntidad || !form.nombreEntidad) {
            setFormError("Código y razón social son obligatorios.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                const { codigoEntidad, ...resto } = form;
                await api.patch(`/entidades-contratos/entidades/${editando.codigoEntidad}`, resto);
            } else {
                await api.post("/entidades-contratos/entidades", form);
            }
            setDialogOpen(false);
            await cargar(searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: EntidadItem) {
        const nuevo = item.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
        try {
            await api.patch(`/entidades-contratos/entidades/${item.codigoEntidad}/estado/${nuevo}`);
            await cargar(searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Catálogo de Entidades</CardTitle>
                        <CardDescription>Gestión de EPS, ARL y convenios.</CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={abrirNuevo}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Entidad
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por código, NIT o nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {error && (
                    <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[140px] font-bold">Código</TableHead>
                                <TableHead className="font-bold">Razón Social</TableHead>
                                <TableHead className="w-[140px] font-bold">NIT</TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[140px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {items.map((item) => (
                                <TableRow key={item.codigoEntidad} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-primary">{item.codigoEntidad}</TableCell>
                                    <TableCell className="max-w-md truncate font-semibold">{item.nombreEntidad}</TableCell>
                                    <TableCell>{item.nit ?? "—"}</TableCell>
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

                <p className="mt-4 text-sm text-muted-foreground">Mostrando {items.length} registros</p>
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar entidad" : "Nueva entidad"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Código</label>
                            <Input
                                value={form.codigoEntidad}
                                disabled={!!editando}
                                onChange={(e) => setForm((f) => ({ ...f, codigoEntidad: e.target.value }))}
                                maxLength={50}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Razón social</label>
                            <Input
                                value={form.nombreEntidad}
                                onChange={(e) => setForm((f) => ({ ...f, nombreEntidad: e.target.value }))}
                                maxLength={100}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">NIT</label>
                            <Input
                                value={form.nit}
                                onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))}
                                maxLength={50}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Dirección</label>
                            <Input
                                value={form.direccion}
                                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                                maxLength={250}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Teléfono</label>
                            <Input
                                value={form.telefono}
                                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
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
