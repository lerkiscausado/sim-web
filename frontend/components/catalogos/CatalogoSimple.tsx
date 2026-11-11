"use client";

import { useCallback, useEffect, useState, type ElementType } from "react";
import { Search, Plus, Loader2, Pencil, Ban, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { useFeedback } from "@/components/ui/feedback";
import { api, ApiError } from "@/lib/api";
import { reglas, useValidacion } from "@/lib/validacion";

interface Item {
    id: number;
    estado: string;
    [campo: string]: unknown;
}

interface Paginado {
    data: Item[];
    total: number;
    page: number;
    pageSize: number;
}

export interface CatalogoSimpleProps {
    /** Ruta base del API, p. ej. "/catalogos/especialidades". */
    endpoint: string;
    /** Nombre del campo de texto que se edita (p. ej. "nombreEspecialidad"). */
    campo: string;
    titulo: string;
    descripcion: string;
    /** Sustantivo en singular para botones y títulos ("Especialidad", "Cargo"…). */
    singular: string;
    /** "a" u "o" para concordar "Nueva/Nuevo". */
    genero?: "a" | "o";
    icono: ElementType;
    textoNuevo?: string;
    textoEditar?: string;
    maxLong?: number;
    /** Muestra el filtro por estado (Activos/Inactivos). */
    filtroEstado?: boolean;
}

/** Catálogo de un solo campo de texto con estado activo/inactivo (especialidades, cargos, medicamentos, especímenes…). */
export function CatalogoSimple({
    endpoint,
    campo,
    titulo,
    descripcion,
    singular,
    genero = "a",
    icono: Icono,
    textoNuevo,
    textoEditar,
    maxLong = 50,
    filtroEstado: conFiltroEstado = true,
}: CatalogoSimpleProps) {
    const { avisar } = useFeedback();
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Item | null>(null);
    const [form, setForm] = useState<{ nombre: string }>({ nombre: "" });
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const v = useValidacion(form, {
        nombre: [reglas.requerido("El nombre es obligatorio."), reglas.minLong(2), reglas.maxLong(maxLong)],
    });

    const cargar = useCallback(
        async (p: number, q?: string, estado?: string) => {
            setLoading(true);
            setError(null);
            try {
                const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
                if (q) qs.set("q", q);
                if (estado) qs.set("estado", estado);
                setResult(await api.get<Paginado>(`${endpoint}?${qs.toString()}`));
            } catch (err) {
                setError(err instanceof ApiError ? err.message : `No se pudo cargar el catálogo de ${titulo.toLowerCase()}`);
            } finally {
                setLoading(false);
            }
        },
        [endpoint, titulo],
    );

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

    function abrir(item: Item | null) {
        setEditando(item);
        setForm({ nombre: item ? String(item[campo] ?? "") : "" });
        setFormError(null);
        v.reiniciar();
        setDialogOpen(true);
    }

    async function guardar() {
        if (!v.comprobar()) return;
        setGuardando(true);
        setFormError(null);
        const payload = { [campo]: form.nombre.trim() };
        try {
            if (editando) await api.patch(`${endpoint}/${editando.id}`, payload);
            else await api.post(endpoint, payload);
            setDialogOpen(false);
            avisar.exito(editando ? "Cambios guardados." : `${singular} cread${genero}.`);
            await cargar(page, searchTerm, filtroEstado);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: Item) {
        const nuevo = item.estado === "A" ? "I" : "A";
        try {
            await api.patch(`${endpoint}/${item.id}/estado/${nuevo}`);
            avisar.exito(nuevo === "A" ? `${singular} activad${genero}.` : `${singular} desactivad${genero}.`);
            await cargar(page, searchTerm, filtroEstado);
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    const nuevoTxt = `${genero === "a" ? "Nueva" : "Nuevo"} ${singular}`;

    return (
        <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <CardTitle className="text-xl font-bold">{titulo}</CardTitle>
                        <CardDescription>{descripcion}</CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={() => abrir(null)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir {singular}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
                <div className="flex items-center gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label={`Buscar en ${titulo.toLowerCase()}`}
                            placeholder="Buscar por nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {conFiltroEstado && (
                        <Select aria-label="Filtrar por estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                            <option value="">Todos los estados</option>
                            <option value="A">Activos</option>
                            <option value="I">Inactivos</option>
                        </Select>
                    )}
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Icono className="h-3.5 w-3.5" />
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
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {result?.data.map((item) => (
                                <TableRow key={item.id} className="transition-colors hover:bg-muted/30">
                                    <TableCell className="font-semibold">{String(item[campo] ?? "")}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={`font-medium ${item.estado === "A" ? "border-green-200 bg-green-100 text-green-700 hover:bg-green-100/80" : ""}`}
                                            variant={item.estado === "A" ? "default" : "destructive"}
                                        >
                                            {item.estado === "A" ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            title="Editar"
                                            aria-label={`Editar ${String(item[campo] ?? "")}`}
                                            onClick={() => abrir(item)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            title={item.estado === "A" ? "Desactivar" : "Activar"}
                                            aria-label={`${item.estado === "A" ? "Desactivar" : "Activar"} ${String(item[campo] ?? "")}`}
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
                <DialogContent className="sm:max-w-md">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            guardar();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>{editando ? `Editar ${singular}` : nuevoTxt}</DialogTitle>
                            <DialogDescription>{editando ? (textoEditar ?? "Actualiza el nombre.") : (textoNuevo ?? descripcion)}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                            <Campo label="Nombre" nombre="nombre" error={v.error("nombre")} requerido>
                                <Input autoFocus value={form.nombre} onChange={(e) => setForm({ nombre: e.target.value })} maxLength={maxLong} />
                            </Campo>
                            <ResumenErrores mensaje={v.resumen} />
                            {formError && <p className="text-sm text-red-600">{formError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={guardando}>
                                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
