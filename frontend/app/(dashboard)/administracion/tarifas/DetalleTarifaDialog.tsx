"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";

interface CupsItem {
    codigoCups: string;
    nombreCups: string;
}

interface TipoEstudio {
    id: number;
    nombreTipoEstudio: string;
}

interface DetalleTarifaItem {
    id: number;
    codigoCups: string;
    idTipoEstudio: number;
    valor: number;
    descuento: number;
    tipoAtencion: "CONSULTA" | "PROCEDIMIENTO";
    cups?: CupsItem;
}

interface Paginado {
    data: DetalleTarifaItem[];
    total: number;
    page: number;
    pageSize: number;
}

const FORM_INICIAL = {
    codigoCups: "",
    idTipoEstudio: undefined as number | undefined,
    valor: undefined as number | undefined,
    descuento: 0,
    tipoAtencion: "PROCEDIMIENTO" as "CONSULTA" | "PROCEDIMIENTO",
};

interface DetalleTarifaDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idTarifa: number;
    nombreTarifa: string;
}

export function DetalleTarifaDialog({ open, onOpenChange, idTarifa, nombreTarifa }: DetalleTarifaDialogProps) {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([]);
    const [form, setForm] = useState(FORM_INICIAL);
    const [cupsQuery, setCupsQuery] = useState("");
    const [cupsResultados, setCupsResultados] = useState<CupsItem[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(
        async (p: number, q?: string) => {
            setLoading(true);
            setError(null);
            try {
                const qs = new URLSearchParams({ page: String(p), pageSize: "10" });
                if (q) qs.set("q", q);
                const data = await api.get<Paginado>(`/entidades-contratos/tarifas/${idTarifa}/detalle?${qs.toString()}`);
                setResult(data);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle de la tarifa");
            } finally {
                setLoading(false);
            }
        },
        [idTarifa],
    );

    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSearchTerm("");
        setForm(FORM_INICIAL);
        setCupsQuery("");
        setFormError(null);
        cargar(1);
        api.get<{ id: number; nombreTipoEstudio: string }[]>("/catalogos/tipo-estudio")
            .then(setTiposEstudio)
            .catch(() => setTiposEstudio([]));
    }, [open, cargar]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm, open, cargar]);

    useEffect(() => {
        if (cupsQuery.trim().length < 2) {
            setCupsResultados([]);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await api.get<CupsItem[]>(`/catalogos/cups/search?q=${encodeURIComponent(cupsQuery)}`);
                setCupsResultados(res);
            } catch {
                setCupsResultados([]);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [cupsQuery]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

    function elegirCups(c: CupsItem) {
        setForm((f) => ({ ...f, codigoCups: c.codigoCups }));
        setCupsQuery(`${c.codigoCups} — ${c.nombreCups}`);
        setCupsResultados([]);
    }

    async function agregar() {
        if (!form.codigoCups || !form.idTipoEstudio || form.valor === undefined) {
            setFormError("CUPS, Tipo de Estudio y Valor son obligatorios.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            await api.post(`/entidades-contratos/tarifas/${idTarifa}/detalle`, form);
            setForm(FORM_INICIAL);
            setCupsQuery("");
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo agregar el procedimiento");
        } finally {
            setGuardando(false);
        }
    }

    async function quitar(id: number) {
        try {
            await api.delete(`/entidades-contratos/tarifas/${idTarifa}/detalle/${id}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo quitar el procedimiento");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalle de Tarifa — {nombreTarifa}</DialogTitle>
                    <DialogDescription>Procedimientos CUPS y valor pactado para esta tarifa.</DialogDescription>
                </DialogHeader>

                <div className="rounded-md border p-4" style={{ borderColor: "var(--border-default)" }}>
                    <p className="mb-3 text-sm font-medium">Agregar procedimiento</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative col-span-2 space-y-1.5">
                            <label className="text-[12.5px] font-medium">CUPS</label>
                            <Input
                                placeholder="Buscar por código o nombre..."
                                value={cupsQuery}
                                onChange={(e) => setCupsQuery(e.target.value)}
                            />
                            {cupsResultados.length > 0 && (
                                <div
                                    className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md"
                                    style={{ background: "var(--surface-raised, #fff)", borderColor: "var(--border-default)" }}
                                >
                                    {cupsResultados.map((c) => (
                                        <button
                                            key={c.codigoCups}
                                            type="button"
                                            className="block w-full px-3 py-2 text-left text-[12.5px] hover:bg-black/5"
                                            onClick={() => elegirCups(c)}
                                        >
                                            <span className="font-semibold">{c.codigoCups}</span> — {c.nombreCups}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Tipo de Estudio</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.idTipoEstudio ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, idTipoEstudio: Number(e.target.value) || undefined }))}
                            >
                                <option value="">Seleccionar…</option>
                                {tiposEstudio.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombreTipoEstudio}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Tipo de Atención</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.tipoAtencion}
                                onChange={(e) => setForm((f) => ({ ...f, tipoAtencion: e.target.value as "CONSULTA" | "PROCEDIMIENTO" }))}
                            >
                                <option value="PROCEDIMIENTO">Procedimiento</option>
                                <option value="CONSULTA">Consulta</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Valor</label>
                            <Input
                                type="number"
                                value={form.valor ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) || undefined }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descuento</label>
                            <Input
                                type="number"
                                value={form.descuento}
                                onChange={(e) => setForm((f) => ({ ...f, descuento: Number(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>
                    {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
                    <Button className="mt-3" size="sm" onClick={agregar} disabled={guardando}>
                        {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Procedimiento
                    </Button>
                </div>

                <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en el detalle..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                <div className="rounded-md border" style={{ borderColor: "var(--border-default)" }}>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold">CUPS</TableHead>
                                <TableHead className="font-bold">Nombre</TableHead>
                                <TableHead className="text-center font-bold">Tipo</TableHead>
                                <TableHead className="text-right font-bold">Valor</TableHead>
                                <TableHead className="text-right font-bold">Descuento</TableHead>
                                <TableHead className="w-[60px] text-right font-bold">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && (!result || result.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-20 text-center text-sm text-muted-foreground">
                                        Sin procedimientos registrados en esta tarifa.
                                    </TableCell>
                                </TableRow>
                            )}
                            {result?.data.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-medium">{d.codigoCups}</TableCell>
                                    <TableCell className="max-w-[220px] truncate text-xs">{d.cups?.nombreCups ?? "—"}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{d.tipoAtencion === "CONSULTA" ? "Consulta" : "Procedimiento"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">${d.valor.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${d.descuento.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" title="Quitar" onClick={() => quitar(d.id)}>
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
            </DialogContent>
        </Dialog>
    );
}
