"use client";

import { useCallback, useMemo, useState } from "react";
import { deISOLocal, hoyISO } from "./fechas";

/**
 * Validación de formularios del lado del cliente.
 *
 * Cada campo tiene una lista de reglas; cada regla devuelve el mensaje de error o null.
 * Los errores solo se muestran después del primer intento de guardar y, a partir de ahí,
 * se recalculan en cada cambio: el campo deja de estar en rojo en cuanto se corrige.
 */

export type Regla<F = Record<string, unknown>> = (valor: unknown, form: F) => string | null;
export type Esquema<F> = Partial<Record<keyof F & string, Regla<F>[]>>;
export type Errores = Record<string, string>;

function vacio(v: unknown): boolean {
    if (v === null || v === undefined) return true;
    if (typeof v === "string") return v.trim() === "" || esHtmlVacio(v);
    if (typeof v === "number") return Number.isNaN(v);
    if (Array.isArray(v)) return v.length === 0;
    return false;
}

/** HTML del editor enriquecido sin texto (p. ej. "<p></p>" o "<p><br></p>"). */
function esHtmlVacio(v: string): boolean {
    if (!v.includes("<")) return false;
    const texto = v
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
    return texto === "" && !/<img/i.test(v);
}

const texto = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());

export const reglas = {
    requerido:
        (mensaje = "Este campo es obligatorio.") =>
        (v: unknown) =>
            vacio(v) ? mensaje : null,

    minLong:
        (n: number, mensaje?: string) =>
        (v: unknown) =>
            !vacio(v) && texto(v).length < n ? (mensaje ?? `Debe tener al menos ${n} caracteres.`) : null,

    maxLong:
        (n: number, mensaje?: string) =>
        (v: unknown) =>
            texto(v).length > n ? (mensaje ?? `Máximo ${n} caracteres (lleva ${texto(v).length}).`) : null,

    email:
        (mensaje = "Correo electrónico no válido.") =>
        (v: unknown) =>
            vacio(v) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(v)) ? null : mensaje,

    /** Varios correos separados por coma o punto y coma. */
    emails:
        (mensaje = "Hay un correo electrónico no válido.") =>
        (v: unknown) => {
            if (vacio(v)) return null;
            const lista = texto(v)
                .split(/[;,]/)
                .map((s) => s.trim())
                .filter(Boolean);
            return lista.every((c) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) ? null : mensaje;
        },

    soloDigitos:
        (mensaje = "Solo se permiten números.") =>
        (v: unknown) =>
            vacio(v) || /^\d+$/.test(texto(v)) ? null : mensaje,

    telefono:
        (mensaje = "Teléfono no válido (7 a 15 dígitos).") =>
        (v: unknown) =>
            vacio(v) || /^\+?[\d\s-]{7,20}$/.test(texto(v)) && texto(v).replace(/\D/g, "").length >= 7
                ? null
                : mensaje,

    numero:
        (opc: { min?: number; max?: number; entero?: boolean; mensaje?: string } = {}) =>
        (v: unknown) => {
            if (vacio(v)) return null;
            const n = typeof v === "number" ? v : Number(texto(v).replace(",", "."));
            if (Number.isNaN(n)) return opc.mensaje ?? "Debe ser un número.";
            if (opc.entero && !Number.isInteger(n)) return opc.mensaje ?? "Debe ser un número entero.";
            if (opc.min !== undefined && n < opc.min) return opc.mensaje ?? `Debe ser mayor o igual a ${opc.min}.`;
            if (opc.max !== undefined && n > opc.max) return opc.mensaje ?? `Debe ser menor o igual a ${opc.max}.`;
            return null;
        },

    fecha:
        (mensaje = "Fecha no válida.") =>
        (v: unknown) =>
            vacio(v) || deISOLocal(texto(v)) ? null : mensaje,

    fechaNoFutura:
        (mensaje = "La fecha no puede ser posterior a hoy.") =>
        (v: unknown) => {
            if (vacio(v)) return null;
            return texto(v).slice(0, 10) > hoyISO() ? mensaje : null;
        },

    /** La fecha debe ser igual o posterior a la de otro campo del mismo formulario. */
    fechaDesde:
        <F>(campo: keyof F & string, etiqueta: string) =>
        (v: unknown, form: F) => {
            const otra = texto((form as Record<string, unknown>)[campo]);
            if (vacio(v) || !otra) return null;
            return texto(v).slice(0, 10) < otra.slice(0, 10) ? `Debe ser igual o posterior a ${etiqueta}.` : null;
        },

    patron:
        (re: RegExp, mensaje: string) =>
        (v: unknown) =>
            vacio(v) || re.test(texto(v)) ? null : mensaje,

    /** Regla que solo aplica cuando se cumple la condición. */
    si:
        <F>(cond: (form: F) => boolean, regla: Regla<F>) =>
        (v: unknown, form: F) =>
            cond(form) ? regla(v, form) : null,
};

export function validar<F>(form: F, esquema: Esquema<F>): Errores {
    const errores: Errores = {};
    for (const [campo, lista] of Object.entries(esquema) as [string, Regla<F>[] | undefined][]) {
        if (!lista) continue;
        const valor = (form as Record<string, unknown>)[campo];
        for (const regla of lista) {
            const msg = regla(valor, form);
            if (msg) {
                errores[campo] = msg;
                break;
            }
        }
    }
    return errores;
}

/** Lleva el foco al primer campo con error (marcado con data-campo en <Campo>). */
export function enfocarPrimerError(errores: Errores, contenedor?: ParentNode | null) {
    const raiz = contenedor ?? (typeof document !== "undefined" ? document : null);
    if (!raiz) return;
    const nombres = Object.keys(errores);
    if (nombres.length === 0) return;
    // Recorre los campos en el orden en que aparecen en pantalla.
    const nodos = Array.from(raiz.querySelectorAll<HTMLElement>("[data-campo]"));
    const primero = nodos.find((n) => nombres.includes(n.dataset.campo ?? ""));
    if (!primero) return;
    primero.scrollIntoView({ behavior: "smooth", block: "center" });
    const control = primero.querySelector<HTMLElement>(
        "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable=true], button[role=combobox]",
    );
    control?.focus({ preventScroll: true });
}

/**
 * Hook de validación.
 *
 *   const v = useValidacion(form, { nombre: [reglas.requerido(), reglas.maxLong(100)] });
 *   async function guardar() { if (!v.comprobar()) return; ... }
 *   <Campo label="Nombre" nombre="nombre" error={v.error("nombre")} requerido> ... </Campo>
 */
export function useValidacion<F>(form: F, esquema: Esquema<F>, extra?: Errores) {
    const [intentado, setIntentado] = useState(false);

    const errores = useMemo<Errores>(() => {
        if (!intentado) return {};
        return { ...validar(form, esquema), ...(extra ?? {}) };
        // El esquema suele declararse en línea; basta con recalcular cuando cambia el formulario.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, intentado, extra]);

    const comprobar = useCallback((): boolean => {
        setIntentado(true);
        const e = { ...validar(form, esquema), ...(extra ?? {}) };
        const ok = Object.keys(e).length === 0;
        if (!ok) setTimeout(() => enfocarPrimerError(e), 0);
        return ok;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form, extra]);

    const reiniciar = useCallback(() => setIntentado(false), []);

    const cantidad = Object.keys(errores).length;

    return {
        errores,
        intentado,
        cantidad,
        comprobar,
        reiniciar,
        error: (campo: keyof F & string) => errores[campo],
        /** Texto para el resumen bajo el formulario. */
        resumen:
            cantidad === 0
                ? null
                : cantidad === 1
                  ? "Revisa el campo marcado en rojo."
                  : `Revisa los ${cantidad} campos marcados en rojo.`,
    };
}
