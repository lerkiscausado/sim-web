const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("sim_token");
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!res.ok) {
        let message = res.statusText;
        try {
            const body = await res.json();
            message = body.message ?? message;
        } catch {
            // respuesta sin cuerpo JSON, se mantiene el statusText
        }
        throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}

export const api = {
    get: <T,>(path: string) => apiFetch<T>(path, { method: "GET" }),
    post: <T,>(path: string, body?: unknown) =>
        apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    patch: <T,>(path: string, body?: unknown) =>
        apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
    delete: <T,>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/** Descarga un binario (ej. PDF) autenticado y devuelve un blob URL listo para abrir/descargar. */
export async function apiFetchBlobUrl(path: string): Promise<string> {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${API_URL}${path}`, { headers });
    if (!res.ok) {
        throw new ApiError(res.status, res.statusText);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
}

/**
 * Envía un formulario multipart/form-data (campos + un archivo opcional),
 * usado para crear/editar registros que incluyen una foto. No se fija
 * Content-Type a mano: el navegador arma el boundary correcto solo.
 */
export async function apiFetchMultipart<T>(
    path: string,
    method: "POST" | "PATCH",
    fields: Record<string, string | number | undefined | null>,
    file?: { fieldName: string; file: File } | null,
): Promise<T> {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    }
    if (file) {
        formData.append(file.fieldName, file.file);
    }

    const res = await fetch(`${API_URL}${path}`, { method, headers, body: formData });

    if (!res.ok) {
        let message = res.statusText;
        try {
            const body = await res.json();
            message = body.message ?? message;
        } catch {
            // respuesta sin cuerpo JSON
        }
        throw new ApiError(res.status, Array.isArray(message) ? message.join(", ") : message);
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
}
