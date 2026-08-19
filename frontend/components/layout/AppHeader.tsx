import Link from "next/link";
import { Activity } from "lucide-react";
import { MainNav } from "./MainNav";
import { UserBadge } from "./UserBadge";

export function AppHeader() {
    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-5 xl:px-6"
            style={{
                background: "var(--nav-surface)",
                borderBottom: "1px solid var(--nav-border)",
                height: "var(--nav-height)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
        >
            {/* Logo */}
            <Link
                href="/inicio"
                className="flex items-center gap-2 shrink-0 mr-3"
                aria-label="SIM — Ir al inicio"
            >
                <span
                    className="flex h-7 w-7 items-center justify-center"
                    style={{
                        background: "var(--clinical-500)",
                        borderRadius: "var(--radius-sm)",
                    }}
                >
                    <Activity size={15} color="#fff" strokeWidth={2.5} />
                </span>
                <span className="hidden sm:flex flex-col leading-none gap-0.5">
                    <span
                        className="font-bold text-[14px] tracking-tight"
                        style={{ color: "var(--ink-primary)" }}
                    >
                        SIM
                    </span>
                    <span
                        className="text-[9px] tracking-[0.1em] uppercase font-semibold"
                        style={{ color: "var(--slate-500)" }}
                    >
                        Sistema Integrado Médico
                    </span>
                </span>
            </Link>

            {/* Vertical rule */}
            <div
                className="hidden md:block h-5 w-px shrink-0"
                style={{ background: "var(--border-default)" }}
            />

            {/* Navigation */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <MainNav />
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <UserBadge />
            </div>
        </header>
    );
}
