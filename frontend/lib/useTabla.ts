"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** Filas por página con que abre toda tabla, hasta que el usuario elija otro valor. */
export const TAMANO_PAGINA_DEFECTO = 10;

// v2: se descartan los valores guardados antes de fijar 10 como predeterminado.
const PREFIJO = "sim_filas_v2_";

function leerTamano(clave: string, defecto: number): number {
    if (typeof window === "undefined") return defecto;
    try {
        const n = Number(window.localStorage.getItem(PREFIJO + clave));
        return Number.isFinite(n) && n > 0 ? n : defecto;
    } catch {
        return defecto;
    }
}

/**
 * Tamaño de página de una tabla, recordado por tabla en este navegador.
 * `clave` identifica la tabla (p. ej. "cups", "contratos").
 */
export function useTamanoPagina(clave: string, defecto = TAMANO_PAGINA_DEFECTO) {
    const [pageSize, setPageSizeState] = useState(defecto);

    // Se lee después del primer render para no romper la hidratación (localStorage no existe en el servidor).
    useEffect(() => {
        const guardado = leerTamano(clave, defecto);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con localStorage (sistema externo)
        if (guardado !== defecto) setPageSizeState(guardado);
    }, [clave, defecto]);

    const setPageSize = useCallback(
        (n: number) => {
            setPageSizeState(n);
            try {
                window.localStorage.setItem(PREFIJO + clave, String(n));
            } catch {
                // almacenamiento no disponible: solo se pierde la preferencia
            }
        },
        [clave],
    );

    return [pageSize, setPageSize] as const;
}

/**
 * Paginación y búsqueda en el navegador para listas que el servidor entrega completas
 * (pendientes por informar, usuarios, plantillas…).
 */
export function usePaginacionLocal<T>(
    items: T[],
    clave: string,
    opciones: { filtro?: (item: T, texto: string) => boolean; defecto?: number } = {},
) {
    const [pageSize, setPageSize] = useTamanoPagina(clave, opciones.defecto ?? TAMANO_PAGINA_DEFECTO);
    const [page, setPage] = useState(1);
    const [busqueda, setBusqueda] = useState("");
    const { filtro } = opciones;

    const filtrados = useMemo(() => {
        const t = busqueda.trim().toLowerCase();
        if (!t || !filtro) return items;
        return items.filter((it) => filtro(it, t));
    }, [items, busqueda, filtro]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize));
    const paginaActual = Math.min(page, totalPaginas);
    const visibles = useMemo(
        () => filtrados.slice((paginaActual - 1) * pageSize, paginaActual * pageSize),
        [filtrados, paginaActual, pageSize],
    );

    return {
        visibles,
        total: filtrados.length,
        totalSinFiltro: items.length,
        busqueda,
        setBusqueda: (t: string) => {
            setBusqueda(t);
            setPage(1);
        },
        paginacion: {
            page: paginaActual,
            pageSize,
            total: filtrados.length,
            onPageChange: setPage,
            onPageSizeChange: (n: number) => {
                setPageSize(n);
                setPage(1);
            },
        },
    };
}
