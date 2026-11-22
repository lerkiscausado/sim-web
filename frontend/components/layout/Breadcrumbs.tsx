"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { breadcrumbLabels, navConfig } from "@/lib/nav-config";

/** Nombre de cada página del menú por su ruta (p. ej. /admisiones → "Consultar Órdenes"). */
const PAGINAS: Record<string, string> = Object.fromEntries(
    navConfig.flatMap((g) => [...(g.href ? [[g.href, g.label]] : []), ...(g.children ?? []).filter((c) => c.href).map((c) => [c.href!, c.label])]),
);

/** Ruta de navegación en la barra superior: SIM › Grupo › Página. */
export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const crumbs = [
        { label: "SIM", href: "/inicio" },
        ...segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const esUltimo = index === segments.length - 1;
            return {
                label: (esUltimo && PAGINAS[href]) || breadcrumbLabels[segment] || capitalize(segment),
                href,
            };
        }),
    ];

    return (
        <nav aria-label="Ruta de navegación" className="flex min-w-0 items-center gap-1.5 text-[12.5px]">
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                    <span key={crumb.href + index} className="flex min-w-0 items-center gap-1.5">
                        {index > 0 && <ChevronRight size={12} className="shrink-0" style={{ color: "var(--ink-muted)" }} />}
                        {isLast ? (
                            <span className="truncate font-semibold" style={{ color: "var(--ink-primary)" }} aria-current="page">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="truncate transition-colors hover:underline underline-offset-2"
                                style={{ color: "var(--ink-tertiary)" }}
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}
