"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { ResumenProvider, useResumen } from "@/lib/resumen";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { CommandPalette } from "./CommandPalette";

interface AppLayoutProps {
    children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <ResumenProvider>
            <Marco>{children}</Marco>
        </ResumenProvider>
    );
}

/** Menú lateral fijo (escritorio) o deslizable (pantallas angostas) + barra superior + contenido. */
function Marco({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { refrescar } = useResumen();
    const [menuMovil, setMenuMovil] = useState(false);
    const [buscador, setBuscador] = useState(false);

    // Al cambiar de página se cierra el menú móvil y se actualizan los contadores del menú.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reacciona al cambio de ruta
        setMenuMovil(false);
        refrescar();
    }, [pathname, refrescar]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setBuscador((v) => !v);
            }
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-canvas)" }}>
            {/* Menú lateral de escritorio */}
            <div className="hidden shrink-0 lg:block">
                <Sidebar />
            </div>

            {/* Menú lateral en pantallas angostas */}
            {menuMovil && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="h-full shadow-xl">
                        <Sidebar onNavegar={() => setMenuMovil(false)} />
                    </div>
                    <button type="button" className="flex-1 bg-black/40" aria-label="Cerrar menú" onClick={() => setMenuMovil(false)} />
                    <button
                        type="button"
                        className="absolute left-[calc(var(--rail-width)+8px)] top-3 rounded-full bg-white p-1.5 shadow"
                        aria-label="Cerrar menú"
                        onClick={() => setMenuMovil(false)}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <header
                    className="flex shrink-0 items-center gap-3 px-4 lg:px-6"
                    style={{
                        height: "var(--nav-height)",
                        background: "var(--surface-raised)",
                        borderBottom: "1px solid var(--border-default)",
                    }}
                >
                    <button
                        type="button"
                        className="-ml-1 rounded-md p-1.5 hover:bg-[var(--surface-inset)] lg:hidden"
                        aria-label="Abrir menú"
                        onClick={() => setMenuMovil(true)}
                    >
                        <Menu size={18} />
                    </button>
                    <Breadcrumbs />
                    <button
                        type="button"
                        onClick={() => setBuscador(true)}
                        className="ml-auto flex h-8 w-9 shrink-0 items-center justify-center gap-2 sm:w-full sm:max-w-[340px] sm:shrink sm:justify-start rounded-[5px] border px-2.5 text-[12.5px] transition-colors hover:border-[var(--border-strong)]"
                        style={{ background: "var(--surface-inset)", borderColor: "var(--border-default)", color: "var(--ink-tertiary)" }}
                        aria-keyshortcuts="Control+K"
                    >
                        <Search size={14} />
                        <span className="hidden truncate sm:inline">Buscar paciente, orden o módulo…</span>
                        <kbd
                            className="dato-mono ml-auto hidden rounded border bg-white px-1.5 text-[10.5px] sm:inline"
                            style={{ borderColor: "var(--border-default)" }}
                        >
                            Ctrl K
                        </kbd>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-7 lg:py-6">{children}</div>
                </main>
            </div>

            <CommandPalette open={buscador} onOpenChange={setBuscador} />
        </div>
    );
}
