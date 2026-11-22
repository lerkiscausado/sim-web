"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

/** Respuesta de GET /inicio/resumen (indicadores del inicio y contadores del menú). */
export interface Resumen {
    empleado: string | null;
    patologiasPendientes: number;
    patologiasConInforme: number;
    citologiasPendientes: number;
    ordenesHoy: number;
    ordenesMes: number;
    firmadosMes: number;
    entregasHoy: number;
    actividad: {
        id: number;
        fecha: string;
        hora: string;
        estudio: string;
        idOrden: number;
        consecutivo: string;
        paciente: string;
        empleado: string | null;
    }[];
}

interface ResumenContextValue {
    resumen: Resumen | null;
    /** Vuelve a pedir el resumen (p. ej. después de firmar un estudio). */
    refrescar: () => Promise<void>;
}

const ResumenContext = createContext<ResumenContextValue>({ resumen: null, refrescar: async () => undefined });

/**
 * Comparte el resumen entre el menú lateral (contadores), la barra de usuario
 * (nombre del empleado) y la página de inicio, con una sola petición.
 */
export function ResumenProvider({ children }: { children: React.ReactNode }) {
    const [resumen, setResumen] = useState<Resumen | null>(null);

    const refrescar = useCallback(async () => {
        try {
            setResumen(await api.get<Resumen>("/inicio/resumen"));
        } catch {
            // sin resumen: el menú se muestra sin contadores
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API (sistema externo)
        refrescar();
        const t = setInterval(refrescar, 2 * 60 * 1000);
        return () => clearInterval(t);
    }, [refrescar]);

    const value = useMemo(() => ({ resumen, refrescar }), [resumen, refrescar]);
    return <ResumenContext.Provider value={value}>{children}</ResumenContext.Provider>;
}

export function useResumen() {
    return useContext(ResumenContext);
}
