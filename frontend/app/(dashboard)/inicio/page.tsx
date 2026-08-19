import {
    Users,
    FileText,
    CalendarDays,
    Activity,
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowRight,
} from "lucide-react";
import Link from "next/link";

const stats = [
    {
        label: "Pacientes Atendidos",
        value: "248",
        delta: "+12 este mes",
        icon: Users,
        iconColor: "var(--clinical-500)",
        iconBg: "var(--clinical-50)",
        barColor: "var(--clinical-400)",
        barWidth: "78%",
    },
    {
        label: "Citas Programadas",
        value: "37",
        delta: "Próximas 7 días",
        icon: CalendarDays,
        iconColor: "var(--status-success)",
        iconBg: "var(--status-success-bg)",
        barColor: "var(--status-success)",
        barWidth: "55%",
    },
    {
        label: "Citologías Pendientes",
        value: "12",
        delta: "Sin resultado",
        icon: FileText,
        iconColor: "var(--status-warning)",
        iconBg: "var(--status-warning-bg)",
        barColor: "var(--status-warning)",
        barWidth: "30%",
    },
    {
        label: "Consultas Hoy",
        value: "9",
        delta: "Completadas: 4 / 9",
        icon: Activity,
        iconColor: "var(--clinical-500)",
        iconBg: "var(--clinical-50)",
        barColor: "var(--clinical-400)",
        barWidth: "44%",
    },
];

const recentActivity = [
    { patient: "María González R.", action: "Citología procesada", time: "12 min", status: "success" },
    { patient: "Carmen Torres V.", action: "Consentimiento firmado", time: "45 min", status: "success" },
    { patient: "Ana Ruiz M.", action: "Cita reprogramada", time: "1 h", status: "warning" },
    { patient: "Laura Castillo P.", action: "Resultado de patología", time: "2 h", status: "success" },
    { patient: "Patricia Vargas L.", action: "Factura pendiente", time: "3 h", status: "danger" },
];

const quickAccess = [
    { label: "Nueva Cita", href: "/admisiones/agenda" },
    { label: "Registrar Paciente", href: "/administracion/pacientes" },
    { label: "Consentimiento Informado", href: "/admisiones/consentimiento" },
    { label: "Toma de Muestra", href: "/atenciones/toma-muestra" },
    { label: "Generar Factura", href: "/administracion/facturacion" },
];

export default function InicioPage() {
    const now = new Date();
    const hour = now.getHours();
    const greeting =
        hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

    return (
        <div className="space-y-6">

            {/* ── Welcome banner ─────────────────────────────────────────── */}
            <div
                className="relative overflow-hidden rounded-lg px-7 py-6"
                style={{
                    background:
                        "var(--nav-ink-accent)",
                    borderRadius: "var(--radius-lg)",
                }}
            >
                <div className="relative z-10">
                    <p
                        className="label-clinical mb-2"
                        style={{ color: "var(--clinical-300)" }}
                    >
                        {now.toLocaleDateString("es-CO", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <h1
                        className="text-[1.5rem] font-bold leading-tight mb-1.5"
                        style={{ color: "#ffffff", letterSpacing: "-0.025em" }}
                    >
                        {greeting}, Dra. Méndez
                    </h1>
                    <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.70)" }}>
                        Tiene{" "}
                        <strong style={{ color: "#fff" }}>9 consultas</strong> programadas hoy y{" "}
                        <strong style={{ color: "#fff" }}>3 resultados</strong> pendientes de revisión.
                    </p>
                </div>
                {/* Clinical vertical grid lines — signature decorative element */}
                <div
                    className="absolute right-0 top-0 bottom-0 w-48 opacity-10"
                    style={{
                        background:
                            "repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px)",
                    }}
                />
            </div>

            {/* ── Stats grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-lg border overflow-hidden"
                            style={{
                                background: "var(--surface-raised)",
                                borderColor: "var(--border-default)",
                            }}
                        >
                            <div className="px-5 pt-4 pb-3">
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center"
                                        style={{
                                            background: stat.iconBg,
                                            borderRadius: "var(--radius-sm)",
                                        }}
                                    >
                                        <Icon size={16} color={stat.iconColor} strokeWidth={1.75} />
                                    </div>
                                    <span className="text-[11px]" style={{ color: "var(--ink-tertiary)" }}>
                                        {stat.delta}
                                    </span>
                                </div>
                                <div className="data-value mb-0.5" style={{ color: "var(--ink-primary)" }}>
                                    {stat.value}
                                </div>
                                <p className="text-[12px] font-medium" style={{ color: "var(--ink-secondary)" }}>
                                    {stat.label}
                                </p>
                            </div>
                            {/* Capacity bar — signature element */}
                            <div className="h-1" style={{ background: "var(--surface-inset)" }}>
                                <div
                                    className="h-full"
                                    style={{ width: stat.barWidth, background: stat.barColor, opacity: 0.7 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Two-column area ─────────────────────────────────────────── */}
            <div className="grid gap-4 xl:grid-cols-3">
                {/* Recent activity */}
                <div
                    className="xl:col-span-2 rounded-lg border overflow-hidden"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                >
                    <div
                        className="flex items-center justify-between px-5 py-3.5 border-b"
                        style={{ borderColor: "var(--border-subtle)" }}
                    >
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color: "var(--accent)" }} />
                            <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                                Actividad Reciente
                            </h2>
                        </div>
                        <span className="text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>Hoy</span>
                    </div>
                    <div>
                        {recentActivity.map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3.5 px-5 py-3 border-b last:border-b-0"
                                style={{ borderColor: "var(--border-subtle)" }}
                            >
                                {item.status === "success" && <CheckCircle2 size={14} color="var(--status-success)" className="shrink-0" />}
                                {item.status === "warning" && <AlertCircle size={14} color="var(--status-warning)" className="shrink-0" />}
                                {item.status === "danger" && <AlertCircle size={14} color="var(--status-danger)" className="shrink-0" />}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12.5px] font-medium truncate" style={{ color: "var(--ink-primary)" }}>{item.patient}</p>
                                    <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>{item.action}</p>
                                </div>
                                <span className="shrink-0 text-[11.5px]" style={{ color: "var(--ink-tertiary)" }}>Hace {item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick access */}
                <div
                    className="rounded-lg border overflow-hidden"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                >
                    <div
                        className="flex items-center gap-2 px-5 py-3.5 border-b"
                        style={{ borderColor: "var(--border-subtle)" }}
                    >
                        <Activity size={14} style={{ color: "var(--accent)" }} />
                        <h2 className="text-[13px] font-semibold" style={{ color: "var(--ink-primary)" }}>
                            Acceso Rápido
                        </h2>
                    </div>
                    <div className="p-3 space-y-1.5">
                        {quickAccess.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="flex items-center justify-between rounded px-3.5 py-2.5 text-[12.5px] font-medium transition-colors group hover:bg-[var(--surface-base)] hover:border-[var(--border-default)]"
                                style={{
                                    color: "var(--ink-primary)",
                                    border: "1px solid var(--border-subtle)",
                                    borderRadius: "var(--radius-sm)",
                                }}
                            >
                                {item.label}
                                <ArrowRight size={12} style={{ color: "var(--ink-tertiary)" }} />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
