"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Trash2, Eye, FileText, Stethoscope, Pencil, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RichTextEditor, htmlToPlainText } from "@/components/ui/rich-text-editor";
import { HtmlPreviewDialog } from "@/components/ui/html-preview-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
    DialogDescription,
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

interface Paginado {
    data: PlantillaPatologia[];
    total: number;
    page: number;
    pageSize: number;
}

const FORM_INICIAL = { nombre: "", macro: "", micro: "", diagnostico: "" };

export default function PlantillasPatologiaPage() {
    const [result, setResult] = useState<Paginado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewItem, setPreviewItem] = useState<PlantillaPatologia | null>(null);
    const [editando, setEditando] = useState<PlantillaPatologia | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "15" });
            if (q) qs.set("q", q);
            const data = await api.get<Paginado>(`/atenciones/plantillas-patologia?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de plantillas");
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
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

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
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar la plantilla");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminar(p: PlantillaPatologia) {
        try {
            await api.delete(`/atenciones/plantillas-patologia/${p.id}`);
            await cargar(page, searchTerm);
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
                    Nueva Plantilla
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Nombre</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5" />Diagnóstico (vista previa)</span></TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && (!result || result.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                                    No se encontraron plantillas.
                                </TableCell>
                            </TableRow>
                        )}
                        {result?.data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-medium">{p.nombre}</TableCell>
                                <TableCell className="max-w-md truncate text-xs text-muted-foreground">
                                    {htmlToPlainText(p.diagnostico) || "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" title="Vista previa" onClick={() => setPreviewItem(p)}>
                                        <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Editar" onClick={() => abrirEditar(p)}>
                                        <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                    </Button>
                                    <Button variant="ghost" size="sm" title="Eliminar" onClick={() => eliminar(p)}>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Plantilla" : "Nueva Plantilla de Patología"}</DialogTitle>
                        <DialogDescription>{editando ? "Actualiza el texto macro, micro o diagnóstico de esta plantilla." : "Crea una nueva plantilla de macro, micro o diagnóstico."}</DialogDescription>
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
                            <RichTextEditor
                                rows={3}
                                value={form.macro}
                                onChange={(html) => setForm((f) => ({ ...f, macro: html }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Descripción microscópica</label>
                            <RichTextEditor
                                rows={3}
                                value={form.micro}
                                onChange={(html) => setForm((f) => ({ ...f, micro: html }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Diagnóstico</label>
                            <RichTextEditor
                                rows={3}
                                value={form.diagnostico}
                                onChange={(html) => setForm((f) => ({ ...f, diagnostico: html }))}
                            />
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <DialogFooter>
                        {(form.macro || form.micro || form.diagnostico) && (
                            <Button type="button" variant="outline" onClick={() => setPreviewItem({ id: 0, ...form })}>
                                <Eye className="mr-2 h-4 w-4" />
                                Vista previa
                            </Button>
                        )}
                        <Button onClick={guardar} disabled={guardando}>
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <HtmlPreviewDialog
                open={!!previewItem}
                onOpenChange={(open) => !open && setPreviewItem(null)}
                titulo={previewItem?.nombre || "Plantilla"}
                maxWidthClassName="max-w-4xl"
                secciones={[
                    { titulo: "Descripción macroscópica", html: previewItem?.macro ?? "" },
                    { titulo: "Descripción microscópica", html: previewItem?.micro ?? "" },
                    { titulo: "Diagnóstico", html: previewItem?.diagnostico ?? "" },
                ]}
            />
        </div>
    );
}
