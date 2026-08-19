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
