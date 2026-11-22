"use client";

import { User, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useResumen } from "@/lib/resumen";
import { nombrePropio } from "@/lib/utils";

/** Usuario en el pie del menú lateral; el menú (perfil, preferencias, salir) se abre hacia arriba. */
export function UserBadge() {
    const { user, logout } = useAuth();
    const { resumen } = useResumen();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const nombre = nombrePropio(resumen?.empleado) || user?.usuario || "";
    const initials =
        nombre
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0])
            .join("")
            .toUpperCase() || "??";
    const roleLabel = user?.admin ? "Administrador" : "Usuario del sistema";

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-1.5 text-left hover:bg-[var(--rail-surface-2)]"
                style={{ background: open ? "var(--rail-surface-2)" : undefined }}
                aria-expanded={open}
                aria-haspopup="true"
                type="button"
            >
                <span
                    className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold"
                    style={{ background: "#3a2523", color: "#f6c6c3" }}
                >
                    {initials}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-[12.5px] font-medium" style={{ color: "var(--rail-ink-active)" }}>
                        {nombre}
                    </span>
                    <span className="truncate text-[11px]">{resumen?.empleado && user?.usuario ? `${user.usuario} · ${roleLabel}` : roleLabel}</span>
                </span>
                <ChevronsUpDown size={13} className="shrink-0 opacity-60" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="absolute bottom-full left-0 right-0 z-50 mb-1.5 overflow-hidden rounded-lg border py-1"
                        style={{
                            background: "var(--surface-overlay)",
                            borderColor: "var(--border-default)",
                            boxShadow: "var(--shadow-overlay)",
                        }}
                    >
                        <div className="py-1">
                            {[
                                { label: "Mi Perfil", icon: User, href: "/perfil" },
                                { label: "Preferencias", icon: Settings, href: "/preferencias" },
                            ].map(({ label, icon: Icon, href }) => (
                                <button
                                    key={label}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[12.5px] hover:bg-[var(--surface-base)]"
                                    style={{ color: "var(--ink-primary)" }}
                                    type="button"
                                    onClick={() => {
                                        setOpen(false);
                                        router.push(href);
                                    }}
                                >
                                    <Icon size={13} style={{ color: "var(--ink-tertiary)" }} />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="border-t py-1" style={{ borderColor: "var(--border-subtle)" }}>
                            <button
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-[12.5px] hover:bg-[var(--status-danger-bg)]"
                                style={{ color: "var(--status-danger)" }}
                                type="button"
                                onClick={logout}
                            >
                                <LogOut size={13} />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
