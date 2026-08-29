"use client";

import { useEffect, useState } from "react";
import { User, Briefcase, ShieldCheck, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Perfil {
    id: number;
    usuario: string;
    admin: boolean;
    empleado: { nombreEmpleado: string; cargo: string | null } | null;
}

export default function PerfilPage() {
    const { user } = useAuth();
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [loading, setLoading] = useState(true);

    const [actual, setActual] = useState("");
    const [nueva, setNueva] = useState("");
    const [repetir, setRepetir] = useState("");
    const [mostrarActual, setMostrarActual] = useState(false);
    const [mostrarNueva, setMostrarNueva] = useState(false);
    const [mostrarRepetir, setMostrarRepetir] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        api
            .get<Perfil>("/users/me")
            .then(setPerfil)
            .finally(() => setLoading(false));
    }, []);

    async function cambiarContrasena() {
        setError(null);
        setOk(false);
        if (!actual || !nueva) {
            setError("Completa la contraseña actual y la nueva.");
            return;
        }
        if (nueva !== repetir) {
            setError("Las contraseñas nuevas no coinciden.");
            return;
        }
        if (nueva.length < 4) {
            setError("La nueva contraseña debe tener al menos 4 caracteres.");
            return;
        }
        setGuardando(true);
        try {
            await api.patch("/users/me/password", { actual, nueva });
            setOk(true);
            setActual("");
            setNueva("");
            setRepetir("");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar la contraseña");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="max-w-2xl space-y-5">
            <div
                className="rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                    Mi Cuenta
                </span>
                <h1 style={{ color: "var(--ink-primary)" }}>Mi Perfil</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    Información de tu cuenta y cambio de contraseña
                </p>
            </div>

            <div
                className="rounded-lg border p-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Nombre</p>
                                <p className="text-sm font-semibold">{perfil?.empleado?.nombreEmpleado ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Cargo</p>
                                <p className="text-sm font-semibold">{perfil?.empleado?.cargo ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Usuario</p>
                                <p className="text-sm font-semibold">{perfil?.usuario ?? user?.usuario}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60">
                                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <div>
                                <p className="text-[11px] font-medium text-muted-foreground">Rol</p>
                                <p className="text-sm font-semibold">{perfil?.admin ? "Administrador" : "Usuario del sistema"}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div
                className="rounded-lg border p-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <p className="mb-1 text-sm font-semibold" style={{ color: "var(--ink-primary)" }}>
                    Cambiar contraseña
                </p>
                <p className="mb-4 text-[12.5px] text-muted-foreground">
                    Necesitas tu contraseña actual para poder cambiarla.
                </p>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-[12.5px] font-medium">Contraseña actual</label>
                        <div className="relative">
                            <Input
                                type={mostrarActual ? "text" : "password"}
                                className="pr-9"
                                value={actual}
                                onChange={(e) => setActual(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setMostrarActual((v) => !v)}
                                className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                tabIndex={-1}
                            >
                                {mostrarActual ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nueva contraseña</label>
                            <div className="relative">
                                <Input
                                    type={mostrarNueva ? "text" : "password"}
                                    className="pr-9"
                                    value={nueva}
                                    onChange={(e) => setNueva(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarNueva((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {mostrarNueva ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Repetir nueva contraseña</label>
                            <div className="relative">
                                <Input
                                    type={mostrarRepetir ? "text" : "password"}
                                    className="pr-9"
                                    value={repetir}
                                    onChange={(e) => setRepetir(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarRepetir((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {mostrarRepetir ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px]"
                            style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </p>
                    )}
                    {ok && (
                        <p className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-[13px] text-green-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            Contraseña actualizada correctamente.
                        </p>
                    )}

                    <Button onClick={cambiarContrasena} disabled={guardando}>
                        {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cambiar Contraseña
                    </Button>
                </div>
            </div>
        </div>
    );
}
