"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";

interface TipoEstudio {
    id: number;
    nombreTipoEstudio: string;
}

interface Especialista {
    id: number;
    nombre: string;
}

interface Plantilla {
    id: number;
    idTipoEstudio: number;
    idEspecialista: number;
    campo1: string | null;
    campo2: string | null;
    campo3: string | null;
    campo4: string | null;
    campo5: string | null;
    campo6: string | null;
    tipoEstudio?: TipoEstudio;
    especialista?: Especialista;
}

const FORM_INICIAL = {
    idTipoEstudio: undefined as number | undefined,
    idEspecialista: undefined as number | undefined,
    campo1: "",
    campo2: "",
    campo3: "",
    campo4: "",
    campo5: "",
    campo6: "",
};

const CAMPOS: { key: keyof typeof FORM_INICIAL; label: string }[] = [
    { key: "campo1", label: "Campo 1" },
    { key: "campo2", label: "Campo 2" },
    { key: "campo3", label: "Campo 3" },
    { key: "campo4", label: "Campo 4" },
    { key: "campo5", label: "Campo 5" },
    { key: "campo6", label: "Campo 6" },
];

export default function PlantillasPage() {
    const [items, setItems] = useState<Plantilla[]>([]);
    const [tiposEstudio, setTiposEstudio] = useState<TipoEstudio[]>([]);
    const [especialistas, setEspecialistas] = useState<Especialista[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Plantilla | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [plantillasData, tiposData, especialistasData] = await Promise.all([
                api.get<Plantilla[]>("/atenciones/plantillas-informes"),
                api.get<TipoEstudio[]>("/catalogos/tipo-estudio"),
                api.get<Especialista[]>("/seguridad/especialistas"),
            ]);
            setItems(plantillasData);
            setTiposEstudio(tiposData);
            setEspecialistas(especialistasData);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de plantillas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    function abrirNuevo() {
        setEditando(null);
        setForm(FORM_INICIAL);
        setFormError(null);
        setDialogOpen(true);
    }

    function abrirEditar(p: Plantilla) {
        setEditando(p);
        setForm({
            idTipoEstudio: p.idTipoEstudio,
            idEspecialista: p.idEspecialista,
            campo1: p.campo1 ?? "",
            campo2: p.campo2 ?? "",
            campo3: p.campo3 ?? "",
            campo4: p.campo4 ?? "",
            campo5: p.campo5 ?? "",
            campo6: p.campo6 ?? "",
        });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.idTipoEstudio || !form.idEspecialista) {
            setFormError("Tipo de estudio y especialista son obligatorios.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/atenciones/plantillas-informes/${editando.id}`, form);
            } else {
                await api.post("/atenciones/plantillas-informes", form);
            }
            setDialogOpen(false);
            await cargar();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la plantilla");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminar(p: Plantilla) {
        try {
            await api.delete(`/atenciones/plantillas-informes/${p.id}`);
            await cargar();
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo eliminar la plantilla");
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
                    <h1 style={{ color: "var(--ink-primary)" }}>Plantillas</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Plantillas de informes por tipo de estudio y especialista
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva plantilla
                </Button>
            </div>

            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tipo de estudio</TableHead>
                            <TableHead>Especialista</TableHead>
                            <TableHead>Vista previa</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                                    No hay plantillas registradas.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell>{p.tipoEstudio?.nombreTipoEstudio ?? `#${p.idTipoEstudio}`}</TableCell>
                                <TableCell>{p.especialista?.nombre ?? `#${p.idEspecialista}`}</TableCell>
                                <TableCell className="max-w-sm truncate text-xs text-muted-foreground">
                                    {p.campo1 || p.campo2 || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(p)}>
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => eliminar(p)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[12.5px] font-medium">Tipo de estudio</label>
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
                                <label className="text-[12.5px] font-medium">Especialista</label>
                                <select
                                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                    value={form.idEspecialista ?? ""}
                                    onChange={(e) => setForm((f) => ({ ...f, idEspecialista: Number(e.target.value) || undefined }))}
                                >
                                    <option value="">Seleccionar…</option>
                                    {especialistas.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {CAMPOS.map(({ key, label }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-[12.5px] font-medium">{label}</label>
                                <Textarea
                                    rows={2}
                                    value={form[key] as string}
                                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                />
                            </div>
                        ))}
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
