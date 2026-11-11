"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Search, ArrowLeft } from "lucide-react";
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
import { api, ApiError } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";
import { Buscador } from "@/components/ui/buscador";
import { useTamanoPagina } from "@/lib/useTabla";

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

interface DetalleTarifaViewProps {
    idTarifa: number;
    nombreTarifa: string;
    onVolver: () => void;
}

export function DetalleTarifaView({ idTarifa, nombreTarifa, onVolver }: DetalleTarifaViewProps) {
    const { avisar } = useFeedback();
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [filtroTipoEstudio, setFiltroTipoEstudio] = useState("");
    const [pageSize, setPageSize] = useTamanoPagina("detalle-tarifa", 10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([]);
    const [form, setForm] = useState(FORM_INICIAL);
    const [cupsQuery, setCupsQuery] = useState("");
    const [cupsResultados, setCupsResultados] = useState<CupsItem[]>([]);
    const [formError, setFormError] = useState<string | null>(null);
    const v = useValidacion(form, {
        codigoCups: [reglas.requerido("Busca y selecciona un CUPS de la lista.")],
        idTipoEstudio: [reglas.requerido("Selecciona el tipo de estudio.")],
        valor: [reglas.requerido("El valor es obligatorio."), reglas.numero({ min: 0, entero: true, mensaje: "Valor no válido (número entero ≥ 0)." })],
        descuento: [reglas.numero({ min: 0, entero: true, mensaje: "Descuento no válido (número entero ≥ 0)." }), (d, f) => (Number(d) > 0 && f.valor !== undefined && Number(d) > Number(f.valor) ? "El descuento no puede superar el valor." : null)],
    });
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(
        async (p: number, q?: string) => {
            setLoading(true);
            setError(null);
            try {
                const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
                if (q) qs.set("q", q);
            if (filtroTipoEstudio) qs.set("idTipoEstudio", filtroTipoEstudio);
                const data = await api.get<Paginado>(`/entidades-contratos/tarifas/${idTarifa}/detalle?${qs.toString()}`);
                setResult(data);
            } catch (err) {
                setError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle de la tarifa");
            } finally {
                setLoading(false);
            }
        },
        [idTarifa, pageSize, filtroTipoEstudio],
    );

    useEffect(() => {
        cargar(1);
        api.get<{ id: number; nombreTipoEstudio: string }[]>("/catalogos/tipo-estudio")
            .then(setTiposEstudio)
            .catch(() => setTiposEstudio([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTarifa]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

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
        if (!v.comprobar()) return;
        setGuardando(true);
        setFormError(null);
        try {
            await api.post(`/entidades-contratos/tarifas/${idTarifa}/detalle`, form);
            setForm(FORM_INICIAL);
            v.reiniciar();
            avisar.exito("Procedimiento agregado a la tarifa.");
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
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Administración · Tarifas
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Detalle de Tarifa — {nombreTarifa}</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Procedimientos CUPS y valor pactado para esta tarifa
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={onVolver}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Tarifas
                </Button>
            </div>

            <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <p className="mb-3 text-sm font-medium">Agregar procedimiento</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <Campo label="CUPS" nombre="codigoCups" error={v.error("codigoCups")} requerido className="relative col-span-2 md:col-span-1">
                        <Buscador
                            placeholder="Buscar por código o nombre..."
                            texto={cupsQuery}
                            onTexto={(t) => {
                                setCupsQuery(t);
                                // Si se edita el texto después de elegir, el CUPS deja de estar seleccionado.
                                setForm((f) => (f.codigoCups ? { ...f, codigoCups: "" } : f));
                            }}
                            resultados={cupsResultados}
                            claveDe={(c) => c.codigoCups}
                            onElegir={(c) => elegirCups(c)}
                            renderItem={(c) => (
                                <>
                                    <span className="font-semibold">{c.codigoCups}</span> — {c.nombreCups}
                                </>
                            )}
                            sinResultados="No se encontraron CUPS."
                        />
                    </Campo>
                    <Campo label="Tipo de Estudio" nombre="idTipoEstudio" error={v.error("idTipoEstudio")} requerido>
                        <Select
                            className="w-full"
                            value={form.idTipoEstudio ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, idTipoEstudio: Number(e.target.value) || undefined }))}
                        >
                            <option value="">Seleccionar…</option>
                            {tiposEstudio.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.nombreTipoEstudio}
                                </option>
                            ))}
                        </Select>
                    </Campo>
                    <div className="space-y-1.5">
                        <label className="text-[13px] font-medium">Tipo de Atención</label>
                        <Select
                            className="w-full"
                            value={form.tipoAtencion}
                            onChange={(e) => setForm((f) => ({ ...f, tipoAtencion: e.target.value as "CONSULTA" | "PROCEDIMIENTO" }))}
                        >
                            <option value="PROCEDIMIENTO">Procedimiento</option>
                            <option value="CONSULTA">Consulta</option>
                        </Select>
                    </div>
                    <Campo label="Valor" nombre="valor" error={v.error("valor")} requerido>
                        <Input
                            type="number"
                            value={form.valor ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) || undefined }))}
                        />
                    </Campo>
                    <Campo label="Descuento" nombre="descuento" error={v.error("descuento")}>
                        <Input
                            type="number"
                            value={form.descuento}
                            onChange={(e) => setForm((f) => ({ ...f, descuento: Number(e.target.value) || 0 }))}
                        />
                    </Campo>
                </div>
                <div className="mt-3">
                    <ResumenErrores mensaje={v.resumen} />
                </div>
                {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
                <Button className="mt-4" size="sm" onClick={agregar} disabled={guardando}>
                    {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Procedimiento
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar en el detalle..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
                <Select aria-label="Tipo de estudio" value={filtroTipoEstudio} onChange={(e) => { setPage(1); setFiltroTipoEstudio(e.target.value); }}>
                    <option value="">Tipo de estudio: todos</option>
                    {tiposEstudio.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.nombreTipoEstudio}
                        </option>
                    ))}
                </Select>
                {(filtroTipoEstudio) && (
                    <Button variant="ghost" size="sm" className="h-9" onClick={() => { setPage(1); setFiltroTipoEstudio(""); }}>
                        Limpiar filtros
                    </Button>
                )}
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
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
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    Sin procedimientos registrados en esta tarifa.
                                </TableCell>
                            </TableRow>
                        )}
                        {result?.data.map((d) => (
                            <TableRow key={d.id}>
                                <TableCell className="font-medium">{d.codigoCups}</TableCell>
                                <TableCell className="max-w-[280px] truncate text-xs">{d.cups?.nombreCups ?? "—"}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline">{d.tipoAtencion === "CONSULTA" ? "Consulta" : "Procedimiento"}</Badge>
                                </TableCell>
                                <TableCell className="text-right">${Number(d.valor).toLocaleString()}</TableCell>
                                <TableCell className="text-right">${Number(d.descuento).toLocaleString()}</TableCell>
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
                <PaginationControls page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={cambiarPagina}
                    onPageSizeChange={(n) => {
                        setPage(1);
                        setPageSize(n);
                    }}
                />
            )}
        </div>
    );
}
