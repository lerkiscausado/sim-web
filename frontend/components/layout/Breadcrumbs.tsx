"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbLabels } from "@/lib/nav-config";

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const crumbs = [
        { label: "Inicio", href: "/" },
        ...segments.map((segment, index) => ({
            label: breadcrumbLabels[segment] ?? capitalize(segment),
            href: "/" + segments.slice(0, index + 1).join("/"),
        })),
    ];

    return (
        <nav
            aria-label="Ruta de navegación"
            className="flex items-center gap-1 px-6 py-2"
            style={{
                background: "var(--surface-raised)",
                borderBottom: "1px solid var(--border-subtle)",
                minHeight: "36px",
            }}
        >
            <Link
                href="/"
                className="flex items-center transition-colors"
                style={{ color: "var(--ink-tertiary)" }}
            >
                <Home size={12} />
            </Link>

            {crumbs.slice(1).map((crumb, index) => {
                const isLast = index === crumbs.length - 2;
                return (
                    <span key={crumb.href} className="flex items-center gap-1">
                        <ChevronRight size={11} style={{ color: "var(--border-strong)" }} />
                        {isLast ? (
                            <span
                                className="text-[12px] font-semibold"
                                style={{ color: "var(--ink-primary)" }}
                            >
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-[12px] transition-colors hover:underline underline-offset-2"
                                style={{ color: "var(--ink-secondary)" }}
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
