"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo de búsqueda con lista de resultados (combobox accesible).
 *
 * - Teclado: ↓/↑ recorren los resultados, Enter elige, Escape cierra, Tab sale.
 * - Clic o toque sobre un resultado lo elige.
 * - ARIA: role="combobox" + listbox/option, aria-activedescendant.
 *
 * Es un componente controlado: el texto y los resultados vienen del padre (que hace la búsqueda);
 * el componente solo maneja la apertura de la lista y la opción resaltada.
 */
export interface BuscadorProps<T> extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "onSelect"> {
    texto: string;
    onTexto: (texto: string) => void;
    resultados: T[];
    onElegir: (item: T) => void;
    claveDe: (item: T) => string | number;
    /** Contenido de cada opción. Por defecto, `textoDe(item)`. */
    renderItem?: (item: T) => React.ReactNode;
    textoDe?: (item: T) => string;
    cargando?: boolean;
    /** Mensaje cuando hay texto suficiente y no hay resultados (omitir para no mostrar nada). */
    sinResultados?: string;
    /** Caracteres mínimos para mostrar "sin resultados". */
    minCaracteres?: number;
    /** Muestra la lupa a la izquierda. */
    conIcono?: boolean;
    claseLista?: string;
}

export function Buscador<T>({
    texto,
    onTexto,
    resultados,
    onElegir,
    claveDe,
    renderItem,
    textoDe,
    cargando,
    sinResultados,
    minCaracteres = 2,
    conIcono = false,
    claseLista,
    className,
    id,
    onFocus,
    onBlur,
    onKeyDown,
    ...inputProps
}: BuscadorProps<T>) {
    const idAuto = React.useId();
    const idInput = id ?? `${idAuto}-input`;
    const idLista = `${idAuto}-lista`;
    const [abierto, setAbierto] = React.useState(false);
    const [activo, setActivo] = React.useState(-1);
    const listaRef = React.useRef<HTMLUListElement>(null);

    // Al cambiar los resultados, se resalta el primero.
    React.useEffect(() => {
        setActivo(resultados.length > 0 ? 0 : -1);
    }, [resultados]);

    // Mantiene visible la opción resaltada al moverse con el teclado.
    React.useEffect(() => {
        if (activo < 0) return;
        listaRef.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
    }, [activo]);

    const mostrarVacio = !!sinResultados && !cargando && texto.trim().length >= minCaracteres && resultados.length === 0;
    const visible = abierto && (resultados.length > 0 || mostrarVacio);

    function elegir(item: T) {
        onElegir(item);
        setAbierto(false);
    }

    function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setAbierto(true);
                setActivo((i) => (resultados.length ? (i + 1) % resultados.length : -1));
                break;
            case "ArrowUp":
                e.preventDefault();
                setAbierto(true);
                setActivo((i) => (resultados.length ? (i <= 0 ? resultados.length - 1 : i - 1) : -1));
                break;
            case "Enter":
                if (visible && activo >= 0 && resultados[activo]) {
                    e.preventDefault();
                    elegir(resultados[activo]);
                }
                break;
            case "Escape":
                if (visible) {
                    e.preventDefault();
                    e.stopPropagation(); // no cierra el diálogo que contiene el buscador
                    setAbierto(false);
                }
                break;
        }
    }

    return (
        <div className="relative">
            {conIcono && <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
            <Input
                {...inputProps}
                id={idInput}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={visible}
                aria-controls={idLista}
                aria-activedescendant={visible && activo >= 0 ? `${idLista}-${activo}` : undefined}
                autoComplete="off"
                className={cn(conIcono && "pl-9", cargando && "pr-8", className)}
                value={texto}
                onChange={(e) => {
                    onTexto(e.target.value);
                    setAbierto(true);
                }}
                onFocus={(e) => {
                    setAbierto(true);
                    onFocus?.(e);
                }}
                onBlur={(e) => {
                    // Deja terminar el clic sobre una opción antes de cerrar.
                    setTimeout(() => setAbierto(false), 150);
                    onBlur?.(e);
                }}
                onKeyDown={teclado}
            />
            {cargando && (
                <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {visible && (
                <ul
                    ref={listaRef}
                    id={idLista}
                    role="listbox"
                    className={cn(
                        "absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-lg",
                        claseLista,
                    )}
                >
                    {resultados.map((item, i) => (
                        <li
                            key={claveDe(item)}
                            id={`${idLista}-${i}`}
                            data-indice={i}
                            role="option"
                            aria-selected={i === activo}
                            className={cn(
                                "cursor-pointer px-3 py-2 text-[13px] leading-snug",
                                i === activo ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                            )}
                            onMouseEnter={() => setActivo(i)}
                            onMouseDown={(e) => {
                                e.preventDefault(); // evita el blur del input antes de elegir
                                elegir(item);
                            }}
                        >
                            {renderItem ? renderItem(item) : textoDe ? textoDe(item) : String(claveDe(item))}
                        </li>
                    ))}
                    {mostrarVacio && <li className="px-3 py-2 text-[13px] text-muted-foreground">{sinResultados}</li>}
                </ul>
            )}
        </div>
    );
}
