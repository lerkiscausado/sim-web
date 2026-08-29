"use client";

export interface Preferencias {
    /** Ruta a la que se redirige justo después de iniciar sesión. */
    paginaInicio: string;
    /** Pide confirmación antes de ejecutar una acción de eliminar. */
    confirmarEliminar: boolean;
    /** Sonido al recibir notificaciones (si el sistema las implementa a futuro). */
    sonidoNotificaciones: boolean;
}

export const PAGINAS_INICIO_DISPONIBLES = [
    { value: "/inicio", label: "Inicio (dashboard general)" },
    { value: "/admisiones/ordenes", label: "Órdenes" },
    { value: "/atenciones/patologias", label: "Patologías" },
    { value: "/atenciones/citologias", label: "Citologías" },
    { value: "/administracion/pacientes", label: "Pacientes" },
];

const DEFAULTS: Preferencias = {
    paginaInicio: "/inicio",
    confirmarEliminar: true,
    sonidoNotificaciones: false,
};

const STORAGE_KEY = "sim_preferencias";

export function getPreferencias(): Preferencias {
    if (typeof window === "undefined") return DEFAULTS;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULTS;
        return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
        return DEFAULTS;
    }
}

export function setPreferencias(prefs: Preferencias) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
