"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface ErrorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Título del diálogo, ej. "No se pudo registrar la orden". */
    titulo?: string;
    /** Mensaje general, se muestra como subtítulo. */
    mensaje?: string | null;
    /** Errores individuales (ej. cada mensaje de validación de un campo), se listan en el recuadro de detalle. */
    detalles?: string[];
}

/** Traduce mensajes técnicos comunes de class-validator a algo legible, sin perder el resto tal cual viene. */
function traducirDetalle(d: string): string {
    const matchNoExiste = d.match(/^property (\w+) should not exist$/);
    if (matchNoExiste) {
        return `Se envió un dato inesperado (${matchNoExiste[1]}) que el servidor no reconoce. Probablemente sea un error de la aplicación, no algo que hayas hecho mal — repórtalo.`;
    }
    return d;
}

export function ErrorDialog({ open, onOpenChange, titulo = "Ocurrió un error", mensaje, detalles }: ErrorDialogProps) {
    const items = detalles && detalles.length > 0 ? detalles : mensaje ? [mensaje] : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center">{titulo}</DialogTitle>
                    <DialogDescription className="text-center">
                        Revisa el detalle abajo antes de intentarlo de nuevo.
                    </DialogDescription>
                </DialogHeader>

                {items.length > 0 && (
                    <div
                        className="space-y-2 rounded-md border px-4 py-3 text-[13px]"
                        style={{ borderColor: "var(--border-default)", background: "var(--surface-sunken, #fef2f2)" }}
                    >
                        {items.length === 1 ? (
                            <p style={{ color: "var(--status-danger, #b91c1c)" }}>{traducirDetalle(items[0])}</p>
                        ) : (
                            <ul className="list-disc space-y-1 pl-4" style={{ color: "var(--status-danger, #b91c1c)" }}>
                                {items.map((d, i) => (
                                    <li key={i}>{traducirDetalle(d)}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
