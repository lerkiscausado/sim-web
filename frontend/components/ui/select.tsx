import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Lista desplegable con el mismo aspecto que <Input> (altura, borde, foco y estado de error).
 * Envuelve el <select> nativo: conserva el teclado, la accesibilidad y el comportamiento móvil del navegador.
 */
function Select({
    className,
    selectClassName,
    children,
    ...props
}: React.ComponentProps<"select"> & {
    /** Clases del contenedor (ancho y márgenes: w-full, w-40, mt-2…). */
    className?: string;
    /** Clases adicionales del propio <select> (p. ej. color o peso del texto). */
    selectClassName?: string;
}) {
    return (
        <div className={cn("relative", className)}>
            <select
                data-slot="select"
                className={cn(
                    "h-9 w-full min-w-0 appearance-none rounded-md border border-input bg-transparent py-1 pl-3 pr-8 text-sm shadow-xs transition-[color,box-shadow] outline-none",
                    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                    "dark:bg-input/30 [&>option]:bg-background [&>option]:text-foreground",
                    selectClassName,
                )}
                {...props}
            >
                {children}
            </select>
            <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
        </div>
    );
}

export { Select };
