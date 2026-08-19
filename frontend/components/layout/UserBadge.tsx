"use client";

import { User, ChevronDown, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function UserBadge() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    const initials = (user?.usuario ?? "??").slice(0, 2).toUpperCase();
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
                className="flex items-center gap-2 rounded-full"
                style={{
                    padding: "4px 10px 4px 4px",
                    background: open ? "var(--nav-hover)" : "transparent",
                    border: "0px solid var(--border-default)",
                    borderRadius: "var(--radius-full)",
                }}
                aria-expanded={open}
                aria-haspopup="true"
                type="button"
            >
                {/* Avatar — round with initials */}
                <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{
                        background: "var(--clinical-100)",
                        color: "var(--clinical-700)",
                    }}
                >
                    {initials}
                </span>

                {/* Name + role — desktop only */}
                <span className="hidden lg:flex flex-col items-start leading-tight">
                    <span className="font-semibold text-[12.5px]" style={{ color: "var(--ink-primary)" }}>
                        {user?.usuario}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--ink-secondary)" }}>
                        {roleLabel}
                    </span>
                </span>

                <ChevronDown
                    size={12}
                    className={cn("ml-0.5", open ? "rotate-180" : "")}
                    style={{ color: "var(--ink-tertiary)" }}
                />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border py-1"
                        style={{
                            background: "var(--nav-dropdown)",
                            borderColor: "var(--border-default)",
                            boxShadow: "var(--shadow-overlay)",
                        }}
                    >
                        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                            <p className="text-[12.5px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                                {user?.usuario}
                            </p>
                            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-secondary)" }}>
                                {roleLabel}
                            </p>
                        </div>
                        <div className="py-1">
                            {[
                                { label: "Mi Perfil", icon: User },
                                { label: "Preferencias", icon: Settings },
                            ].map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[12.5px] hover:bg-[var(--surface-base)]"
                                    style={{ color: "var(--ink-primary)" }}
                                    type="button"
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
