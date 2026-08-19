"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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

interface PlantillaPatologia {
    id: number;
    nombre: string;
    macro: string;
    micro: string;
    diagnostico: string;
}

const FORM_INICIAL = { nombre: "", macro: "", micro: "", diagnostico: "" };

export default function PlantillasPatologiaPage() {
    const [items, setItems] = useState<PlantillaPatologia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<PlantillaPatologia | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.get<PlantillaPatologia[]>("/atenciones/plantillas-patologia");
            setItems(data);
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

    function abrirEditar(p: PlantillaPatologia) {
        setEditando(p);
        setForm({ nombre: p.nombre, macro: p.macro, micro: p.micro, diagnostico: p.diagnostico });
        setFormError(null);
        setDialogOpen(true);
    }

    async function guardar() {
        if (!form.nombre) {
            setFormError("El nombre de la plantilla es obligatorio.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/atenciones/plantillas-patologia/${editando.id}`, form);
            } else {
                await api.post("/atenciones/plantillas-patologia", form);
            }
            setDialogOpen(false);
            await cargar();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la plantilla");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminar(p: PlantillaPatologia) {
        try {
            await api.delete(`/atenciones/plantillas-patologia/${p.id}`);
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
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Plantillas Patología</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Textos rápidos de macro, micro y diagnóstico reutilizables al capturar un informe
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva plantilla
                </Button>
            </div>

            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Diagnóstico (vista previa)</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                    No hay plantillas registradas todavía.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.nombre}</TableCell>
                                <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                                    {p.diagnostico || "—"}
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
                        <DialogTitle>{editando ? "Editar plantilla" : "Nueva plantilla de patología"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nombre</label>
                            <Input
                                value={form.nombre}
                                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                maxLength={100}
                                placeholder="Ej: Biopsia de piel — nevus benigno"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción macroscópica</label>
                            <Textarea
                                rows={3}
                                value={form.macro}
                                onChange={(e) => setForm((f) => ({ ...f, macro: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción microscópica</label>
                            <Textarea
                                rows={3}
                                value={form.micro}
                                onChange={(e) => setForm((f) => ({ ...f, micro: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Diagnóstico</label>
                            <Textarea
                                rows={3}
                                value={form.diagnostico}
                                onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))}
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
