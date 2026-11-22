"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, ShieldCheck } from "lucide-react";
import { navConfig, type NavItem } from "@/lib/nav-config";
import { useResumen } from "@/lib/resumen";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { UserBadge } from "./UserBadge";

const GRUPOS_KEY = "sim_menu_grupos";

/** Todas las rutas del menú, para elegir la más específica que coincide con la URL. */
function rutas(items: NavItem[]): string[] {
    return items.flatMap((i) => [...(i.href ? [i.href] : []), ...rutas(i.children ?? [])]);
}

/** La ruta del menú que corresponde a la página actual (la coincidencia más larga). */
export function rutaActiva(pathname: string): string | null {
    const candidatas = rutas(navConfig).filter((h) => pathname === h || pathname.startsWith(h + "/"));
    return candidatas.sort((a, b) => b.length - a.length)[0] ?? null;
}

function leerGrupos(): Record<string, boolean> {
    try {
        return JSON.parse(window.localStorage.getItem(GRUPOS_KEY) ?? "{}");
    } catch {
        return {};
    }
}

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
    const pathname = usePathname();
    const activa = rutaActiva(pathname);
    const { resumen } = useResumen();
    const [licencia, setLicencia] = useState<string | null>(null);
    // Grupos cerrados por el usuario (se recuerda en este navegador). Por defecto todos abiertos.
    const [cerrados, setCerrados] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage (sistema externo)
        setCerrados(leerGrupos());
        api.get<{ cliente: string } | null>("/seguridad/licencias/activa")
            .then((l) => setLicencia(l?.cliente ?? null))
            .catch(() => setLicencia(null));
    }, []);

    const contadores = useMemo(
        () => ({
            patologias: resumen?.patologiasPendientes ?? 0,
            citologias: resumen?.citologiasPendientes ?? 0,
        }),
        [resumen],
    );

    function alternar(grupo: string) {
        setCerrados((c) => {
            const n = { ...c, [grupo]: !c[grupo] };
            try {
                window.localStorage.setItem(GRUPOS_KEY, JSON.stringify(n));
            } catch {
                // sin almacenamiento: solo se pierde la preferencia
            }
            return n;
        });
    }

    return (
        <aside
            className="flex h-full flex-col"
            style={{ background: "var(--rail-surface)", color: "var(--rail-ink)", width: "var(--rail-width)" }}
            aria-label="Menú principal"
        >
            <Link
                href="/inicio"
                onClick={onNavegar}
                className="flex items-center gap-2.5 px-4 pb-3.5 pt-4"
                style={{ borderBottom: "1px solid var(--rail-line)" }}
                aria-label="SIM — Ir al inicio"
            >
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[5px]" style={{ background: "var(--clinical-500)" }}>
                    <Activity size={16} color="#fff" strokeWidth={2.5} />
                </span>
                <span className="flex flex-col leading-none">
                    <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--rail-ink-active)" }}>
                        SIM
                    </span>
                    <span className="mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]">Sistema Integrado Médico</span>
                </span>
            </Link>

            {licencia && (
                <div
                    className="mx-3 mb-1 mt-3 rounded-[7px] px-2.5 py-2"
                    style={{ border: "1px solid var(--rail-line)", background: "var(--rail-surface-2)" }}
                    title="Licencia activa"
                >
                    <p className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.1em]">
                        <ShieldCheck size={11} /> Licencia
                    </p>
                    <p className="mt-0.5 truncate text-[12px] font-medium" style={{ color: "var(--rail-ink-active)" }}>
                        {licencia}
                    </p>
                </div>
            )}

            <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-1 [scrollbar-color:var(--rail-line)_transparent]">
                {navConfig.map((item) =>
                    item.children ? (
                        <div key={item.label} className="mt-2">
                            <button
                                type="button"
                                onClick={() => alternar(item.label)}
                                aria-expanded={!cerrados[item.label]}
                                className="flex w-full items-center justify-between rounded px-2.5 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] hover:text-[var(--rail-ink)]"
                                style={{ color: "var(--rail-ink-group)" }}
                            >
                                {item.label}
                                <ChevronDown size={12} className={cn("transition-transform", cerrados[item.label] && "-rotate-90")} />
                            </button>
                            {!cerrados[item.label] &&
                                item.children.map((child) => (
                                    <EnlaceMenu
                                        key={child.href}
                                        item={child}
                                        activo={child.href === activa}
                                        contador={child.contador ? contadores[child.contador] : undefined}
                                        onNavegar={onNavegar}
                                    />
                                ))}
                        </div>
                    ) : (
                        <EnlaceMenu key={item.label} item={item} activo={item.href === activa} onNavegar={onNavegar} />
                    ),
                )}
            </nav>

            <div className="p-2" style={{ borderTop: "1px solid var(--rail-line)" }}>
                <UserBadge />
            </div>
        </aside>
    );
}

function EnlaceMenu({
    item,
    activo,
    contador,
    onNavegar,
}: {
    item: NavItem;
    activo: boolean;
    contador?: number;
    onNavegar?: () => void;
}) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href ?? "#"}
            onClick={onNavegar}
            title={item.description}
            aria-current={activo ? "page" : undefined}
            className={cn(
                "relative flex items-center gap-2.5 rounded-[5px] px-2.5 py-[7px] text-[13px] transition-colors",
                "hover:bg-[var(--rail-surface-2)] hover:text-[var(--rail-ink-active)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-400)]",
                activo && "bg-[var(--rail-surface-2)] text-[var(--rail-ink-active)]",
            )}
        >
            {activo && <span className="absolute -left-2 bottom-[7px] top-[7px] w-[3px] rounded-r" style={{ background: "var(--clinical-500)" }} />}
            {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0" />}
            <span className="truncate">{item.label}</span>
            {!!contador && (
                <span
                    className="dato-mono ml-auto rounded-full px-1.5 text-[11px] leading-[18px]"
                    style={{
                        background: activo ? "var(--clinical-500)" : "var(--rail-count)",
                        color: activo ? "#fff" : "#c9d0da",
                    }}
                    aria-label={`${contador} pendientes`}
                >
                    {contador}
                </span>
            )}
        </Link>
    );
}
