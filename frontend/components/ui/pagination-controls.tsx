"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const TAMANOS_PAGINA = [10, 20, 30, 50, 100];

interface PaginationControlsProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    /** Si se indica, muestra el selector "Filas por página". */
    onPageSizeChange?: (pageSize: number) => void;
    opcionesTamano?: number[];
    className?: string;
}

/** Números de página a mostrar: primera, última y vecinas de la actual, con "…" en los saltos. */
export function paginasVisibles(actual: number, total: number): (number | "…")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, actual - 1, actual, actual + 1].filter((p) => p >= 1 && p <= total));
    if (actual <= 3) [2, 3, 4].forEach((p) => set.add(p));
    if (actual >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => set.add(p));
    const orden = [...set].sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    orden.forEach((p, i) => {
        if (i > 0 && p - orden[i - 1] > 1) out.push("…");
        out.push(p);
    });
    return out;
}

export function PaginationControls({
    page,
    pageSize,
    total,
    onPageChange,
    onPageSizeChange,
    opcionesTamano = TAMANOS_PAGINA,
    className,
}: PaginationControlsProps) {
    const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
    const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const hasta = Math.min(page * pageSize, total);
    const opciones = opcionesTamano.includes(pageSize) ? opcionesTamano : [...opcionesTamano, pageSize].sort((a, b) => a - b);
    const ir = (p: number) => onPageChange(Math.min(Math.max(p, 1), totalPaginas));

    return (
        <nav aria-label="Paginación" className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {onPageSizeChange && (
                    <label className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Filas por página</span>
                        <Select
                            aria-label="Filas por página"
                            className="w-[76px]"
                            selectClassName="h-8"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        >
                            {opciones.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Select>
                    </label>
                )}
                <span aria-live="polite">
                    {total === 0 ? (
                        "Sin registros"
                    ) : (
                        <>
                            Mostrando <strong className="font-semibold text-foreground">{desde.toLocaleString()}</strong>–
                            <strong className="font-semibold text-foreground">{hasta.toLocaleString()}</strong> de{" "}
                            <strong className="font-semibold text-foreground">{total.toLocaleString()}</strong>
                        </>
                    )}
                </span>
            </div>

            {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Primera página" title="Primera página" disabled={page <= 1} onClick={() => ir(1)}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Página anterior" title="Anterior" disabled={page <= 1} onClick={() => ir(page - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="hidden items-center gap-1 sm:flex">
                        {paginasVisibles(page, totalPaginas).map((p, i) =>
                            p === "…" ? (
                                <span key={`s${i}`} className="px-1 text-sm text-muted-foreground">
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={p === page ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 min-w-8 px-2"
                                    aria-label={`Página ${p}`}
                                    aria-current={p === page ? "page" : undefined}
                                    onClick={() => ir(p)}
                                >
                                    {p}
                                </Button>
                            ),
                        )}
                    </div>
                    <span className="px-2 text-sm text-muted-foreground sm:hidden">
                        {page} / {totalPaginas}
                    </span>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Página siguiente" title="Siguiente" disabled={page >= totalPaginas} onClick={() => ir(page + 1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Última página" title="Última página" disabled={page >= totalPaginas} onClick={() => ir(totalPaginas)}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </nav>
    );
}
