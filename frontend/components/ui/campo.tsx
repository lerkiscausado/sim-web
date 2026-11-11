import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Envoltorio de un campo de formulario: etiqueta, control y mensaje de error.
 * Cuando hay error, el control que contiene (input, select, textarea, editor o combobox)
 * se resalta en rojo mediante la clase `campo-invalido` (ver globals.css).
 */
export function Campo({
    label,
    nombre,
    error,
    requerido,
    ayuda,
    className,
    labelClassName,
    children,
}: {
    label?: React.ReactNode;
    /** Nombre del campo en el formulario; permite llevar el foco al primer error. */
    nombre?: string;
    error?: string | null;
    requerido?: boolean;
    ayuda?: React.ReactNode;
    className?: string;
    labelClassName?: string;
    children: React.ReactNode;
}) {
    const idError = nombre ? `error-${nombre}` : undefined;
    return (
        <div
            data-campo={nombre}
            className={cn("space-y-1.5", error && "campo-invalido", className)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
        >
            {label && (
                <label className={cn("block text-[12.5px] font-medium", labelClassName, error && "text-red-600")}>
                    {label}
                    {requerido && <span className="ml-0.5 text-red-600">*</span>}
                </label>
            )}
            {children}
            {error ? (
                <p id={idError} role="alert" className="flex items-start gap-1 text-[11.5px] leading-tight text-red-600">
                    <AlertCircle className="mt-px h-3 w-3 shrink-0" />
                    <span>{error}</span>
                </p>
            ) : (
                ayuda && <p className="text-[11.5px] text-muted-foreground">{ayuda}</p>
            )}
        </div>
    );
}

/** Resumen de errores para mostrar junto a los botones del formulario. */
export function ResumenErrores({ mensaje }: { mensaje?: string | null }) {
    if (!mensaje) return null;
    return (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {mensaje}
        </p>
    );
}
