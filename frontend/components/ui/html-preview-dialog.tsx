"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { sanitizeHtml } from "@/components/ui/rich-text-editor";

interface Seccion {
    titulo: string;
    html: string;
    /** Resalta el título y el contenido de esta sección (ej. Diagnóstico). */
    destacado?: boolean;
}

interface HtmlPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    titulo: string;
    secciones: Seccion[];
    /** Clase de ancho máximo del modal (Tailwind), por defecto max-w-2xl. */
    maxWidthClassName?: string;
}

export function HtmlPreviewDialog({ open, onOpenChange, titulo, secciones, maxWidthClassName = "max-w-2xl" }: HtmlPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-h-[85vh] overflow-y-auto ${maxWidthClassName}`}>
                <DialogHeader>
                    <DialogTitle>Vista previa — {titulo}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {secciones.map((s) => (
                        <div key={s.titulo}>
                            <p
                                className={
                                    s.destacado
                                        ? "mb-1 text-[13px] font-bold text-foreground"
                                        : "mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                                }
                            >
                                {s.titulo}
                            </p>
                            {s.html ? (
                                <div
                                    className={`prose-sm max-w-none rounded-md border px-3 py-2 text-sm ${
                                        s.destacado ? "border-primary/30 bg-primary/5" : "bg-muted/20"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.html) }}
                                />
                            ) : (
                                <p className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                    (vacío)
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
