import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Tarjeta con borde (sin sombra): la superficie básica del sistema. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
    return (
        <section
            className={cn("overflow-hidden rounded-[7px] border", className)}
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            {...props}
        />
    );
}

/** Cabecera de una tarjeta: título, etiqueta opcional y contenido alineado a la derecha. */
export function PanelHeader({
    titulo,
    icono,
    etiqueta,
    children,
    className,
}: {
    titulo: React.ReactNode;
    icono?: React.ReactNode;
    etiqueta?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}) {
    return (
        <header className={cn("flex items-center gap-2.5 border-b px-4 py-3", className)} style={{ borderColor: "var(--border-subtle)" }}>
            {icono}
            <h2 className="font-semibold" style={{ color: "var(--ink-primary)", fontSize: 13, letterSpacing: 0, lineHeight: 1.4 }}>
                {titulo}
            </h2>
            {etiqueta}
            {children && <div className="ml-auto flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-tertiary)" }}>{children}</div>}
        </header>
    );
}

/** Etiqueta neutra pequeña (sede, tipo, formato…). */
export function Etiqueta({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            className={cn("inline-flex h-5 items-center whitespace-nowrap rounded-[4px] border px-1.5 text-[11px]", className)}
            style={{ background: "var(--surface-inset)", borderColor: "var(--border-subtle)", color: "var(--ink-secondary)" }}
            {...props}
        />
    );
}

export type Tono = "exito" | "aviso" | "info" | "marca" | "neutro" | "morado";

const TONOS: Record<Tono, { bg: string; fg: string }> = {
    exito: { bg: "var(--status-success-bg)", fg: "var(--status-success)" },
    aviso: { bg: "var(--status-warning-bg)", fg: "var(--status-warning)" },
    info: { bg: "var(--status-info-bg)", fg: "var(--status-info)" },
    marca: { bg: "var(--clinical-50)", fg: "var(--clinical-600)" },
    neutro: { bg: "#eef0f3", fg: "var(--ink-secondary)" },
    morado: { bg: "#efeafd", fg: "#5b3cc4" },
};

/** Píldora de estado con punto de color. */
export function Pildora({ tono = "neutro", className, children, ...props }: React.ComponentProps<"span"> & { tono?: Tono }) {
    const t = TONOS[tono];
    return (
        <span
            className={cn("inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold", className)}
            style={{ background: t.bg, color: t.fg }}
            {...props}
        >
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: "currentColor" }} />
            {children}
        </span>
    );
}

const ESTADOS_ORDEN: Record<string, { tono: Tono; texto: string }> = {
    PENDIENTE: { tono: "aviso", texto: "Pendiente" },
    PROCESO: { tono: "info", texto: "En proceso" },
    ATENDIDO: { tono: "exito", texto: "Atendido" },
    FACTURADO: { tono: "morado", texto: "Facturado" },
    CANCELADO: { tono: "neutro", texto: "Cancelado" },
};

/** Estado de una orden (PENDIENTE, PROCESO, ATENDIDO, FACTURADO, CANCELADO). */
export function EstadoOrden({ estado }: { estado: string }) {
    const e = ESTADOS_ORDEN[estado] ?? { tono: "neutro" as Tono, texto: estado || "—" };
    return <Pildora tono={e.tono}>{e.texto}</Pildora>;
}

/**
 * Indicador con "barra de capacidad": valor grande, detalle y una barra de 4 px al pie
 * que muestra la proporción (0–1) del indicador.
 */
export function Indicador({
    titulo,
    valor,
    detalle,
    proporcion,
    color,
    marca,
    href,
}: {
    titulo: string;
    valor: React.ReactNode;
    detalle?: React.ReactNode;
    proporcion: number;
    color: string;
    marca?: React.ReactNode;
    href?: string;
}) {
    const contenido = (
        <>
            <div className="px-4 pt-3.5">
                <div className="flex items-start justify-between gap-2 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                    <span>{titulo}</span>
                    {marca}
                </div>
                <div className="mb-0.5 mt-2 text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums" style={{ color: "var(--ink-primary)" }}>
                    {valor}
                </div>
                <div className="mb-3.5 mt-1.5 min-h-[17px] text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>
                    {detalle}
                </div>
            </div>
            <div className="h-1" style={{ background: "var(--border-subtle)" }}>
                <div className="h-full" style={{ width: `${Math.round(Math.min(1, Math.max(0, proporcion)) * 100)}%`, background: color, opacity: 0.75 }} />
            </div>
        </>
    );
    const clase = "block overflow-hidden rounded-[7px] border transition-colors";
    const estilo = { background: "var(--surface-raised)", borderColor: "var(--border-default)" };
    return href ? (
        <Link href={href} className={cn(clase, "hover:border-[var(--border-strong)]")} style={estilo}>
            {contenido}
        </Link>
    ) : (
        <div className={clase} style={estilo}>
            {contenido}
        </div>
    );
}
