"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
}

export function PaginationControls({ page, pageSize, total, onPageChange }: PaginationControlsProps) {
    if (total === 0) return null;
    const totalPaginas = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
                {total.toLocaleString()} registros · Página {page} de {totalPaginas}
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPaginas} onClick={() => onPageChange(page + 1)}>
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
