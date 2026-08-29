"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth, ApiError } from "@/lib/auth";
import { getPreferencias } from "@/lib/preferencias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [usuario, setUsuario] = useState("");
    const [pass, setPass] = useState("");
    const [mostrarPass, setMostrarPass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(usuario, pass);
            router.push(getPreferencias().paginaInicio);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="flex min-h-screen items-center justify-center px-4"
            style={{ background: "var(--surface-base, #f5f6f8)" }}
        >
            <div
                className="w-full max-w-sm rounded-lg border p-8"
                style={{
                    background: "var(--surface-raised, #fff)",
                    borderColor: "var(--border-default, #e5e7eb)",
                }}
            >
                <div className="mb-6 flex flex-col items-center text-center">
                    <span
                        className="mb-3 flex h-10 w-10 items-center justify-center rounded-md"
                        style={{ background: "var(--clinical-500, #2563eb)" }}
                    >
                        <Activity size={20} color="#fff" strokeWidth={2.5} />
                    </span>
                    <h1 className="text-lg font-bold" style={{ color: "var(--ink-primary, #111827)" }}>
                        SIM — Sistema Integrado Médico
                    </h1>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-secondary, #6b7280)" }}>
                        Ingresa con tu usuario del sistema
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="usuario" className="text-[12.5px] font-medium">
                            Usuario
                        </label>
                        <Input
                            id="usuario"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            autoComplete="username"
                            required
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="pass" className="text-[12.5px] font-medium">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Input
                                id="pass"
                                type={mostrarPass ? "text" : "password"}
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="pr-9"
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarPass((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center px-2.5"
                                style={{ color: "var(--ink-tertiary, #9ca3af)" }}
                                aria-label={mostrarPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                                tabIndex={-1}
                            >
                                {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p
                            className="rounded-md px-3 py-2 text-[12.5px]"
                            style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                        >
                            {error}
                        </p>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="animate-spin" size={14} />}
                        Iniciar sesión
                    </Button>
                </form>
            </div>
        </div>
    );
}
