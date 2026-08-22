"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Plus,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Mars,
    Venus,
    Phone,
    MapPin,
    Mail,
    IdCard,
    Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { PacienteFormDialog, type Paciente, type TipoIdentificacion } from "@/components/pacientes/PacienteFormDialog";

interface Paginated {
    data: Paciente[];
    total: number;
    page: number;
    pageSize: number;
}

function nombreCompleto(p: Paciente) {
    return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
}

function calcularEdad(fechaNacimientoISO: string): number {
    const nacimiento = new Date(fechaNacimientoISO);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
}

export default function PacientesPage() {
    const [result, setResult] = useState<Paginated | null>(null);
    const [tiposIdentificacion, setTiposIdentificacion] = useState<TipoIdentificacion[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<Paciente | null>(null);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: "20" });
            if (q) qs.set("q", q);
            const data = await api.get<Paginated>(`/pacientes?${qs.toString()}`);
            setResult(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de pacientes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar(1);
        api.get<TipoIdentificacion[]>("/catalogos/tipo-identificacion")
            .then(setTiposIdentificacion)
            .catch(() => setTiposIdentificacion([]));
    }, [cargar]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 350);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function cambiarPagina(nueva: number) {
        setPage(nueva);
        cargar(nueva, searchTerm);
    }

    function abrirNuevo() {
        setEditando(null);
        setDialogOpen(true);
    }

    function abrirEditar(p: Paciente) {
        setEditando(p);
        setDialogOpen(true);
    }

    function alGuardar() {
        cargar(page, searchTerm);
    }

    const totalPaginas = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Administración
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Pacientes</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        {result ? `${result.total.toLocaleString()} pacientes registrados` : "Registro y búsqueda de pacientes"}
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Paciente
                </Button>
            </div>

            <div
                className="flex items-center gap-3 rounded-full border px-2 py-2"
                style={{ borderColor: "var(--border-default)", background: "var(--surface-raised)" }}
            >
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, apellidos o identificación..."
                        className="rounded-full border-none pl-9 shadow-none focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {loading && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
            </div>

            {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <div className="overflow-hidden rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[56px]" />
                            <TableHead>Identificación</TableHead>
                            <TableHead>Nombre completo</TableHead>
                            <TableHead>Fecha nacimiento</TableHead>
                            <TableHead>Edad</TableHead>
                            <TableHead>Género</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Correo</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && (!result || result.data.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-sm text-muted-foreground">
                                    No se encontraron pacientes.
                                </TableCell>
                            </TableRow>
                        )}
                        {result?.data.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="py-2.5">
                                    <PacienteAvatar idPaciente={p.id} width={36} />
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="inline-flex items-center gap-1.5">
                                        <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                                        {p.idTipoIdentificacion}{p.identificacion}
                                    </span>
                                </TableCell>
                                <TableCell className="font-bold" style={{ color: "var(--ink-primary)" }}>
                                    {nombreCompleto(p).toUpperCase()}
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {p.fechaNacimiento}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm">{calcularEdad(p.fechaNacimiento)} años</TableCell>
                                <TableCell>
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                                        style={
                                            p.sexo === "M"
                                                ? { background: "#DBEAFE", color: "#1E40AF" }
                                                : { background: "#FCE7F3", color: "#9D174D" }
                                        }
                                    >
                                        {p.sexo === "M" ? <Mars className="h-3 w-3" /> : <Venus className="h-3 w-3" />}
                                        {p.sexo === "M" ? "HOMBRE" : "MUJER"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" />
                                        {p.telefono || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-[160px] truncate text-sm">
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                                        {p.direccion || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate text-sm">
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                        {p.correoElectronico || "—"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(p)}>
                                        <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {result && result.total > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Página {page} de {totalPaginas}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => cambiarPagina(page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPaginas}
                            onClick={() => cambiarPagina(page + 1)}
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <PacienteFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editando={editando}
                tiposIdentificacion={tiposIdentificacion}
                onSaved={alGuardar}
            />
        </div>
    );
}
