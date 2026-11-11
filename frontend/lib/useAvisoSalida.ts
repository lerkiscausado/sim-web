"use client";

import { useEffect } from "react";

/**
 * Mientras `activo` sea verdadero, el navegador pide confirmación al recargar o cerrar la pestaña
 * (evita perder un informe a medio escribir).
 */
export function useAvisoSalida(activo: boolean) {
    useEffect(() => {
        if (!activo) return;
        const manejar = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // Necesario en algunos navegadores para mostrar el diálogo.
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", manejar);
        return () => window.removeEventListener("beforeunload", manejar);
    }, [activo]);
}
