import { ApiError } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function token(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("sim_token");
}

function nombreDesdeCabecera(res: Response, porDefecto: string): string {
    const cd = res.headers.get("Content-Disposition") ?? "";
    const utf = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    if (utf) return decodeURIComponent(utf[1]);
    const simple = /filename="?([^";]+)"?/i.exec(cd);
    return simple ? simple[1] : porDefecto;
}

async function errorDe(res: Response): Promise<ApiError> {
    let mensaje = res.statusText || "Error";
    let detalles: string[] | undefined;
    try {
        const body = await res.json();
        if (Array.isArray(body.message)) {
            detalles = body.message;
            mensaje = body.message.join(", ");
        } else if (body.message) {
            mensaje = body.message;
        }
    } catch {
        // sin cuerpo JSON
    }
    return new ApiError(res.status, mensaje, detalles);
}

/** Pide un archivo autenticado (GET o POST con JSON) y devuelve blob + nombre + cabeceras. */
export async function pedirArchivo(
    path: string,
    opciones: { metodo?: "GET" | "POST"; cuerpo?: unknown; nombrePorDefecto?: string } = {},
): Promise<{ blob: Blob; nombre: string; headers: Headers }> {
    const headers = new Headers();
    const t = token();
    if (t) headers.set("Authorization", `Bearer ${t}`);
    if (opciones.cuerpo !== undefined) headers.set("Content-Type", "application/json");
    const res = await fetch(`${API_URL}${path}`, {
        method: opciones.metodo ?? "GET",
        headers,
        body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
    if (!res.ok) throw await errorDe(res);
    return { blob: await res.blob(), nombre: nombreDesdeCabecera(res, opciones.nombrePorDefecto ?? "archivo"), headers: res.headers };
}

/**
 * Abre un PDF en una pestaña nueva. La pestaña se abre de inmediato (antes de
 * esperar la respuesta) para que el navegador no la bloquee como ventana emergente.
 */
export async function abrirPdf(path: string): Promise<void> {
    const ventana = typeof window !== "undefined" ? window.open("", "_blank") : null;
    if (ventana) {
        ventana.document.title = "Generando PDF…";
        ventana.document.body.innerHTML =
            '<p style="font-family:sans-serif;color:#555;padding:24px">Generando el documento, un momento…</p>';
    }
    try {
        const { blob } = await pedirArchivo(path);
        const url = URL.createObjectURL(blob);
        if (ventana) ventana.location.href = url;
        else window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
    } catch (e) {
        ventana?.close();
        throw e;
    }
}

/** Descarga un archivo con el nombre que indique el servidor. */
export async function descargarArchivo(
    path: string,
    opciones: { metodo?: "GET" | "POST"; cuerpo?: unknown; nombrePorDefecto?: string } = {},
): Promise<Headers> {
    const { blob, nombre, headers } = await pedirArchivo(path, opciones);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
    return headers;
}

/** URL de objeto para mostrar una imagen autenticada en un <img>. */
export async function urlImagen(path: string): Promise<string> {
    const { blob } = await pedirArchivo(path);
    return URL.createObjectURL(blob);
}

export const apiUrl = API_URL;
