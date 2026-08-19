"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";

type Status = "Atendido" | "Pendiente" | "Cancelado";

interface Admision {
    consecutivo: string;
    fechaIngreso: string;
    identificacion: string;
    nombre: string;
    telefono: string;
    estudio: string;
    especimen: string;
    sede: string;
    contrato: string;
    estado: Status;
}

const DATA: Admision[] = [
    { consecutivo: "10254-25", fechaIngreso: "2024-05-22", identificacion: "CC45674521", nombre: "Ana García Pérez", telefono: "3101234567", estudio: "Citología", especimen: "Cérvix", sede: "Principal", contrato: "SaludTotal EPS", estado: "Atendido" },
    { consecutivo: "10254-26", fechaIngreso: "2024-05-22", identificacion: "CC12345678", nombre: "Carlos Martínez López", telefono: "3207654321", estudio: "Biopsia", especimen: "Piel", sede: "Norte", contrato: "SURA EPS", estado: "Pendiente" },
    { consecutivo: "10254-27", fechaIngreso: "2024-05-23", identificacion: "CC87654321", nombre: "Javier Fernández Ruiz", telefono: "3008876543", estudio: "Estudio Anatómico", especimen: "Hígado", sede: "Principal", contrato: "Compensar EPS", estado: "Cancelado" },
    { consecutivo: "10254-28", fechaIngreso: "2024-05-23", identificacion: "CC5432167B", nombre: "Lucía Morales G.", telefono: "3151237890", estudio: "Citología", especimen: "Tiroides", sede: "Sur", contrato: "Sanitas EPS", estado: "Pendiente" },
    { consecutivo: "10254-29", fechaIngreso: "2024-05-24", identificacion: "CC39765432", nombre: "Laura Gómez", telefono: "3112345678", estudio: "Biopsia", especimen: "Mama", sede: "Principal", contrato: "SaludTotal EPS", estado: "Atendido" },
    { consecutivo: "10254-30", fechaIngreso: "2024-05-24", identificacion: "CC78912345", nombre: "Marta Rodríguez S.", telefono: "3204561234", estudio: "Citología", especimen: "Cérvix", sede: "Este", contrato: "Compensar EPS", estado: "Atendido" },
    { consecutivo: "10254-31", fechaIngreso: "2024-05-25", identificacion: "CC23456789", nombre: "Sofía Herrera V.", telefono: "3509871234", estudio: "Biopsia", especimen: "Nódulo", sede: "Norte", contrato: "SURA EPS", estado: "Pendiente" },
];

const PAGE_SIZE = 5;

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
    Atendido: { label: "Atendido", color: "#15803d", bg: "#dcfce7" },
    Pendiente: { label: "Pendiente", color: "#b45309", bg: "#fef3c7" },
    Cancelado: { label: "Cancelado", color: "#b91c1c", bg: "#fee2e2" },
};

const COL_HEADERS = [
    "Consecutivo",
    "Fecha Ingreso",
    "Identificación",
    "Nombre",
    "Teléfono",
    "Estudio",
    "Espécimen",
    "Sede",
    "Contrato",
    "Estado",
];

export default function AdmisionesPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = DATA.filter((r) =>
        [r.nombre, r.estudio, r.identificacion, r.consecutivo]
            .join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="space-y-5">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 style={{ color: "var(--ink-primary)" }}>Gestión de Admisiones</h1>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Administre las admisiones de pacientes.
                    </p>
                </div>
                <button
                    className="flex items-center gap-2 rounded-md px-4 py-2.5 text-[13px] font-semibold text-white transition-colors shrink-0"
                    style={{ background: "var(--clinical-600)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--clinical-700)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "var(--clinical-600)")}
                >
                    <PlusCircle size={15} />
                    Nueva Admisión
                </button>
            </div>

            {/* ── Table card ──────────────────────────────────────────────── */}
            <div
                className="rounded-lg border overflow-hidden"
                style={{
                    background: "var(--surface-raised)",
                    borderColor: "var(--border-default)",
                }}
            >
                {/* Card header */}
                <div
                    className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                >
                    <div>
                        <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                            Lista de Admisiones
                        </h2>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-secondary)" }}>
                            Un listado de todas las admisiones recientes.
                        </p>
                    </div>
                    {/* Search */}
                    <div
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                        style={{ borderColor: "var(--border-default)", background: "var(--surface-inset)" }}
                    >
                        <Search size={13} style={{ color: "var(--ink-tertiary)" }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, estudio..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="bg-transparent text-[12.5px] outline-none w-52"
                            style={{ color: "var(--ink-primary)" }}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                                {COL_HEADERS.map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-[11.5px] font-semibold whitespace-nowrap"
                                        style={{ color: "var(--clinical-600)", background: "var(--surface-base)" }}
                                    >
                                        {h}
                                    </th>
                                ))}
                                <th
                                    className="px-4 py-3"
                                    style={{ background: "var(--surface-base)" }}
                                />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={COL_HEADERS.length + 1}
                                        className="py-12 text-center text-[13px]"
                                        style={{ color: "var(--ink-tertiary)" }}
                                    >
                                        Sin resultados para &ldquo;{search}&rdquo;
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, i) => {
                                    const status = statusConfig[row.estado];
                                    return (
                                        <tr
                                            key={row.consecutivo}
                                            className="transition-colors"
                                            style={{
                                                borderBottom: "1px solid var(--border-subtle)",
                                                background: i % 2 === 0 ? "transparent" : "var(--surface-base)",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-base)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                            <td className="px-4 py-3 text-[12.5px] font-medium whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
                                                {row.consecutivo}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.fechaIngreso}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.identificacion}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] font-medium whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
                                                {row.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.telefono}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-primary)" }}>
                                                {row.estudio}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.especimen}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.sede}
                                            </td>
                                            <td className="px-4 py-3 text-[12.5px] whitespace-nowrap" style={{ color: "var(--ink-secondary)" }}>
                                                {row.contrato}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className="inline-flex items-center rounded px-2 py-0.5 text-[11.5px] font-semibold"
                                                    style={{
                                                        color: status.color,
                                                        background: status.bg,
                                                        borderRadius: "var(--radius-xs)",
                                                    }}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-[12px]" style={{ color: "var(--ink-tertiary)" }}>
                                                •••
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div
                    className="flex items-center justify-end gap-3 px-5 py-3.5 border-t"
                    style={{ borderColor: "var(--border-subtle)" }}
                >
                    <span className="text-[12.5px]" style={{ color: "var(--ink-tertiary)" }}>
                        Página {page} de {totalPages || 1}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-1 rounded px-3 py-1.5 text-[12.5px] font-medium border transition-colors disabled:opacity-40"
                            style={{
                                color: "var(--ink-primary)",
                                borderColor: "var(--border-default)",
                                background: "transparent",
                            }}
                        >
                            <ChevronLeft size={13} />
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="flex items-center gap-1 rounded px-3 py-1.5 text-[12.5px] font-semibold border transition-colors disabled:opacity-40"
                            style={{
                                color: "var(--clinical-700)",
                                borderColor: "var(--clinical-200)",
                                background: "var(--clinical-50)",
                            }}
                        >
                            Siguiente
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
