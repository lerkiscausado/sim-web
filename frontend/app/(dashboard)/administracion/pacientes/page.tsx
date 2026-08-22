"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    Camera,
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, apiFetchMultipart, ApiError } from "@/lib/api";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";

interface TipoIdentificacion {
    id: string;
    nombreTipoIdentificacion: string;
}

interface Paciente {
    id: number;
    idTipoIdentificacion: string;
    identificacion: string;
    primerNombre: string;
    segundoNombre: string | null;
    primerApellido: string;
    segundoApellido: string | null;
    sexo: "M" | "F";
    fechaNacimiento: string;
    direccion: string | null;
    telefono: string | null;
    correoElectronico: string | null;
    estadoCivil: string;
    codigoTipoUsuario: number;
    tipoIdentificacion?: { id: string; nombreTipoIdentificacion: string };
}

interface Paginated {
    data: Paciente[];
    total: number;
    page: number;
    pageSize: number;
}

const FORM_INICIAL = {
    idTipoIdentificacion: "CC",
    identificacion: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    sexo: "F",
    fechaNacimiento: "",
    direccion: "",
    telefono: "",
    correoElectronico: "",
    estadoCivil: "SOLTERO",
    codigoTipoUsuario: 1,
};

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
    const [form, setForm] = useState(FORM_INICIAL);
    const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    function limpiarFoto() {
        setFotoArchivo(null);
        if (fotoPreview) URL.revokeObjectURL(fotoPreview);
        setFotoPreview(null);
    }

    function abrirNuevo() {
        setEditando(null);
        setForm(FORM_INICIAL);
        setFormError(null);
        limpiarFoto();
        setDialogOpen(true);
    }

    function abrirEditar(p: Paciente) {
        setEditando(p);
        setForm({
            idTipoIdentificacion: p.idTipoIdentificacion,
            identificacion: p.identificacion,
            primerNombre: p.primerNombre,
            segundoNombre: p.segundoNombre ?? "",
            primerApellido: p.primerApellido,
            segundoApellido: p.segundoApellido ?? "",
            sexo: p.sexo,
            fechaNacimiento: p.fechaNacimiento,
            direccion: p.direccion ?? "",
            telefono: p.telefono ?? "",
            correoElectronico: p.correoElectronico ?? "",
            estadoCivil: p.estadoCivil,
            codigoTipoUsuario: p.codigoTipoUsuario,
        });
        setFormError(null);
        limpiarFoto();
        setDialogOpen(true);
    }

    function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        setFotoArchivo(archivo);
        if (fotoPreview) URL.revokeObjectURL(fotoPreview);
        setFotoPreview(URL.createObjectURL(archivo));
    }

    async function guardar() {
        if (!form.identificacion || !form.primerNombre || !form.primerApellido || !form.fechaNacimiento) {
            setFormError("Identificación, nombres, apellido y fecha de nacimiento son obligatorios.");
            return;
        }
        setGuardando(true);
        setFormError(null);
        try {
            const archivoFoto = fotoArchivo ? { fieldName: "foto", file: fotoArchivo } : null;
            if (editando) {
                // Tipo de identificación e identificación no se envían: no son editables.
                const { idTipoIdentificacion, identificacion, ...resto } = form;
                await apiFetchMultipart(`/pacientes/${editando.id}`, "PATCH", resto, archivoFoto);
            } else {
                await apiFetchMultipart("/pacientes", "POST", form, archivoFoto);
            }
            setDialogOpen(false);
            limpiarFoto();
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el paciente");
        } finally {
            setGuardando(false);
        }
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
                    Nuevo paciente
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

            <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border-default)" }}>
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
                                        {p.tipoIdentificacion?.nombreTipoIdentificacion ?? p.idTipoIdentificacion} {p.identificacion}
                                    </span>
                                </TableCell>
                                <TableCell className="font-bold" style={{ color: "var(--ink-primary)" }}>
                                    {nombreCompleto(p)}
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar paciente" : "Nuevo paciente"}</DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center gap-4 py-2">
                        <div
                            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted/40"
                            style={{ borderColor: "var(--border-default)" }}
                        >
                            {fotoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
                            ) : editando ? (
                                <PacienteAvatar idPaciente={editando.id} width={80} />
                            ) : (
                                <Camera className="h-7 w-7 text-muted-foreground/60" />
                            )}
                        </div>
                        <div>
                            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Camera className="mr-2 h-4 w-4" />
                                {fotoPreview ? "Cambiar foto" : "Subir foto"}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={elegirFoto}
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                                Si no subes una foto, se guarda un ícono genérico.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Tipo de identificación</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-60"
                                value={form.idTipoIdentificacion}
                                disabled={!!editando}
                                onChange={(e) => setForm((f) => ({ ...f, idTipoIdentificacion: e.target.value }))}
                            >
                                <option value="">Seleccionar…</option>
                                {tiposIdentificacion.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombreTipoIdentificacion} ({t.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Identificación</label>
                            <Input
                                value={form.identificacion}
                                onChange={(e) => setForm((f) => ({ ...f, identificacion: e.target.value }))}
                                disabled={!!editando}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Primer nombre</label>
                            <Input
                                value={form.primerNombre}
                                onChange={(e) => setForm((f) => ({ ...f, primerNombre: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Segundo nombre</label>
                            <Input
                                value={form.segundoNombre}
                                onChange={(e) => setForm((f) => ({ ...f, segundoNombre: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Primer apellido</label>
                            <Input
                                value={form.primerApellido}
                                onChange={(e) => setForm((f) => ({ ...f, primerApellido: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Segundo apellido</label>
                            <Input
                                value={form.segundoApellido}
                                onChange={(e) => setForm((f) => ({ ...f, segundoApellido: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Sexo</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.sexo}
                                onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}
                            >
                                <option value="F">Femenino</option>
                                <option value="M">Masculino</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Fecha de nacimiento</label>
                            <Input
                                type="date"
                                value={form.fechaNacimiento}
                                onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                            />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[12.5px] font-medium">Dirección</label>
                            <Input
                                value={form.direccion}
                                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Teléfono</label>
                            <Input
                                value={form.telefono}
                                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Correo electrónico</label>
                            <Input
                                type="email"
                                value={form.correoElectronico}
                                onChange={(e) => setForm((f) => ({ ...f, correoElectronico: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Estado civil</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={form.estadoCivil}
                                onChange={(e) => setForm((f) => ({ ...f, estadoCivil: e.target.value }))}
                            >
                                <option value="SOLTERO">Soltero(a)</option>
                                <option value="CASADO">Casado(a)</option>
                                <option value="UNION LIBRE">Unión libre</option>
                                <option value="DIVORCIADO">Divorciado(a)</option>
                                <option value="VIUDO">Viudo(a)</option>
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    <DialogFooter>
                        <Button onClick={guardar} disabled={guardando}>
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
