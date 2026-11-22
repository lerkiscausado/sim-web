"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { navConfig, type NavItem } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

interface Opcion {
    clave: string;
    titulo: string;
    grupo: string;
    href: string;
    icon?: NavItem["icon"];
}

const quitarTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const OPCIONES_MENU: Opcion[] = navConfig.flatMap((g) =>
    g.children
        ? g.children.filter((c) => c.href).map((c) => ({ clave: c.href!, titulo: c.label, grupo: g.label, href: c.href!, icon: c.icon }))
        : g.href
          ? [{ clave: g.href, titulo: g.label, grupo: "Ir a", href: g.href, icon: g.icon }]
          : [],
);

/**
 * Buscador global (Ctrl/⌘ + K): salta a cualquier opción del menú o busca
 * una orden/paciente en Consultar Órdenes.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
    const router = useRouter();
    const [texto, setTexto] = useState("");
    const [indice, setIndice] = useState(0);
    const listaRef = useRef<HTMLDivElement>(null);

    const opciones = useMemo(() => {
        const t = quitarTildes(texto.trim());
        const menu = t ? OPCIONES_MENU.filter((o) => quitarTildes(`${o.titulo} ${o.grupo}`).includes(t)) : OPCIONES_MENU;
        const t2 = encodeURIComponent(texto.trim());
        const buscarOrden: Opcion[] = texto.trim()
            ? [
                  {
                      clave: "buscar-pendientes",
                      titulo: `Buscar “${texto.trim()}” en órdenes por atender`,
                      grupo: "Órdenes y pacientes",
                      href: `/admisiones/ordenes?q=${t2}`,
                      icon: Search,
                  },
                  {
                      clave: "buscar-historial",
                      titulo: `Buscar “${texto.trim()}” en el historial`,
                      grupo: "Órdenes y pacientes",
                      href: `/admisiones?q=${t2}`,
                      icon: Search,
                  },
              ]
            : [];
        return [...buscarOrden, ...menu];
    }, [texto]);

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia el buscador al cerrarlo
            setTexto("");
            setIndice(0);
        }
    }, [open]);

    useEffect(() => {
        listaRef.current?.querySelector<HTMLElement>(`[data-indice="${indice}"]`)?.scrollIntoView({ block: "nearest" });
    }, [indice]);

    function ir(o: Opcion | undefined) {
        if (!o) return;
        onOpenChange(false);
        router.push(o.href);
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndice((i) => Math.min(i + 1, opciones.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndice((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            ir(opciones[indice]);
        }
    }

    let grupoAnterior = "";
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0" showCloseButton={false}>
                <DialogTitle className="sr-only">Buscar en SIM</DialogTitle>
                <DialogDescription className="sr-only">Escriba para ir a una opción del menú o buscar una orden.</DialogDescription>
                <div className="flex items-center gap-2.5 border-b px-4" style={{ borderColor: "var(--border-default)" }}>
                    <Search size={16} style={{ color: "var(--ink-tertiary)" }} />
                    <input
                        autoFocus
                        value={texto}
                        onChange={(e) => {
                            setTexto(e.target.value);
                            setIndice(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Buscar paciente, orden o ir a un módulo…"
                        className="h-12 flex-1 bg-transparent text-[14px] outline-none"
                        aria-label="Buscar"
                        role="combobox"
                        aria-expanded
                        aria-controls="cmdk-lista"
                        aria-activedescendant={opciones[indice] ? `cmdk-${indice}` : undefined}
                    />
                    <kbd className="dato-mono rounded border px-1.5 text-[10.5px]" style={{ borderColor: "var(--border-default)", color: "var(--ink-tertiary)" }}>
                        Esc
                    </kbd>
                </div>
                <div ref={listaRef} id="cmdk-lista" role="listbox" className="max-h-[360px] overflow-y-auto p-1.5">
                    {opciones.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">Sin resultados.</p>}
                    {opciones.map((o, i) => {
                        const Icon = o.icon;
                        const cabecera = o.grupo !== grupoAnterior;
                        grupoAnterior = o.grupo;
                        return (
                            <div key={o.clave}>
                                {cabecera && (
                                    <p className="px-2.5 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ink-tertiary)" }}>
                                        {o.grupo}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    id={`cmdk-${i}`}
                                    role="option"
                                    aria-selected={i === indice}
                                    data-indice={i}
                                    onMouseMove={() => setIndice(i)}
                                    onClick={() => ir(o)}
                                    className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px]", i === indice && "bg-[var(--clinical-50)]")}
                                    style={{ color: i === indice ? "var(--clinical-700)" : "var(--ink-primary)" }}
                                >
                                    {Icon && <Icon size={15} strokeWidth={1.75} className="shrink-0" />}
                                    <span className="flex-1 truncate">{o.titulo}</span>
                                    {i === indice && <CornerDownLeft size={13} className="opacity-60" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
