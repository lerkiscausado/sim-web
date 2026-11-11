"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Loader2, Pencil, Ban, CheckCircle2, User, Briefcase, GraduationCap, IdCard } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";
import { useTamanoPagina } from "@/lib/useTabla";

interface Cargo {
    id: number;
    nombreCargo: string;
}

interface Especialidad {
    id: number;
    nombreEspecialidad: string;
}

interface EmpleadoItem {
    id: number;
    nombreEmpleado: string;
    idCargo: number;
    idEspecialidad: number;
    registroMedico: string | null;
    estado: "A" | "I";
    cargo?: Cargo;
    especialidad?: Especialidad;
}

interface Paginado {
    data: EmpleadoItem[];
    total: number;
    page: number;
    pageSize: number;
}

const FORM_INICIAL = {
    nombreEmpleado: "",
    idCargo: undefined as number | undefined,
    idEspecialidad: undefined as number | undefined,
    registroMedico: "",
};

export default function Empleados() {
    const { avisar } = useFeedback();
    const [result, setResult] = useState<Paginado | null>(null);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroCargo, setFiltroCargo] = useState("");
    const [pageSize, setPageSize] = useTamanoPagina("empleados");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editando, setEditando] = useState<EmpleadoItem | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [formError, setFormError] = useState<string | null>(null);
    const v = useValidacion(form, {
        nombreEmpleado: [reglas.requerido("El nombre es obligatorio."), reglas.minLong(3), reglas.maxLong(100)],
        idCargo: [reglas.requerido("Selecciona el cargo.")],
        idEspecialidad: [reglas.requerido("Selecciona la especialidad.")],
        registroMedico: [reglas.maxLong(50)],
    });
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async (p: number, q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
            if (q) qs.set("q", q);
            if (filtroEstado) qs.set("estado", filtroEstado);
            if (filtroCargo) qs.set("idCargo", filtroCargo);
            const [empleadosData, cargosData, especialidadesData] = await Promise.all([
                api.get<Paginado>(`/seguridad/empleados?${qs.toString()}`),
                api.get<Cargo[]>("/catalogos/cargos/activos"),
                api.get<Especialidad[]>("/catalogos/especialidades/activas"),
            ]);
            setResult(empleadosData);
            setCargos(cargosData);
            setEspecialidades(especialidadesData);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de empleados");
        } finally {
            setLoading(false);
        }
    }, [pageSize, filtroEstado, filtroCargo]);

    useEffect(() => {
        cargar(1);
    }, [cargar]);

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            cargar(1, searchTerm);
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm, cargar]);

    function cambiarPagina(p: number) {
        setPage(p);
        cargar(p, searchTerm);
    }

    function abrirNuevo() {
        setEditando(null);
        setForm(FORM_INICIAL);
        setFormError(null);
        v.reiniciar();
        setDialogOpen(true);
    }

    function abrirEditar(item: EmpleadoItem) {
        setEditando(item);
        setForm({
            nombreEmpleado: item.nombreEmpleado,
            idCargo: item.idCargo,
            idEspecialidad: item.idEspecialidad,
            registroMedico: item.registroMedico ?? "",
        });
        setFormError(null);
        v.reiniciar();
        setDialogOpen(true);
    }

    async function guardar() {
        if (!v.comprobar()) return;
        setGuardando(true);
        setFormError(null);
        try {
            if (editando) {
                await api.patch(`/seguridad/empleados/${editando.id}`, form);
            } else {
                await api.post("/seguridad/empleados", form);
            }
            setDialogOpen(false);
            avisar.exito(editando ? "Cambios guardados." : "Registro creado.");
            await cargar(page, searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleEstado(item: EmpleadoItem) {
        const nuevo = item.estado === "A" ? "I" : "A";
        try {
            await api.patch(`/seguridad/empleados/${item.id}/estado/${nuevo}`);
            await cargar(page, searchTerm);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
        }
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold">Empleados</CardTitle>
                        <CardDescription>Gestión del personal asistencial y administrativo.</CardDescription>
                    </div>
                    <Button size="sm" className="h-9" onClick={abrirNuevo}>
                        <Plus className="mr-2 h-4 w-4" />
                        Añadir Empleado
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select aria-label="Estado" value={filtroEstado} onChange={(e) => { setPage(1); setFiltroEstado(e.target.value); }}>
                        <option value="">Estado: todos</option>
                        <option value="A">Activos</option>
                        <option value="I">Inactivos</option>
                    </Select>
                    <Select aria-label="Cargo" value={filtroCargo} onChange={(e) => { setPage(1); setFiltroCargo(e.target.value); }}>
                        <option value="">Cargo: todos</option>
                        {cargos.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombreCargo}
                            </option>
                        ))}
                    </Select>
                    {(filtroEstado || filtroCargo) && (
                        <Button variant="ghost" size="sm" className="h-9" onClick={() => { setPage(1); setFiltroEstado(""); setFiltroCargo(""); }}>
                            Limpiar filtros
                        </Button>
                    )}
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Nombre</span></TableHead>
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />Cargo</span></TableHead>
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Especialidad</span></TableHead>
                                <TableHead className="font-bold"><span className="inline-flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" />Registro Médico</span></TableHead>
                                <TableHead className="w-[100px] font-bold text-center">Estado</TableHead>
                                <TableHead className="w-[140px] text-right font-bold">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!loading && (!result || result.data.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                        No se encontraron resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                            {result?.data.map((item) => (
                                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-semibold">{item.nombreEmpleado}</TableCell>
                                    <TableCell>{item.cargo?.nombreCargo ?? "—"}</TableCell>
                                    <TableCell>{item.especialidad?.nombreEspecialidad ?? "—"}</TableCell>
                                    <TableCell>{item.registroMedico ?? "—"}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={`font-medium ${item.estado === "A" ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : ""}`}
                                            variant={item.estado === "A" ? "default" : "destructive"}
                                        >
                                            {item.estado === "A" ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-2" title="Editar" onClick={() => abrirEditar(item)}>
                                            <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2"
                                            title={item.estado === "A" ? "Desactivar" : "Activar"}
                                            onClick={() => toggleEstado(item)}
                                        >
                                            {item.estado === "A" ? (
                                                <Ban className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                            ) : (
                                                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#059669" }} />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {result && (
                    <PaginationControls page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={cambiarPagina}
                    onPageSizeChange={(n) => {
                        setPage(1);
                        setPageSize(n);
                    }}
                />
                )}
            </CardContent>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editando ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
                        <DialogDescription>{editando ? "Actualiza los datos del empleado." : "Registra un nuevo empleado asistencial o administrativo."}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Campo label="Nombre completo" nombre="nombreEmpleado" error={v.error("nombreEmpleado")} requerido>
                            <Input
                                value={form.nombreEmpleado}
                                onChange={(e) => setForm((f) => ({ ...f, nombreEmpleado: e.target.value }))}
                                maxLength={50}
                            />
                        </Campo>
                        <Campo label="Cargo" nombre="idCargo" error={v.error("idCargo")} requerido>
                            <Select
                                className="w-full"
                                value={form.idCargo ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, idCargo: Number(e.target.value) || undefined }))}
                            >
                                <option value="">Seleccionar…</option>
                                {cargos.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombreCargo}
                                    </option>
                                ))}
                            </Select>
                        </Campo>
                        <Campo label="Especialidad" nombre="idEspecialidad" error={v.error("idEspecialidad")} requerido>
                            <Select
                                className="w-full"
                                value={form.idEspecialidad ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, idEspecialidad: Number(e.target.value) || undefined }))}
                            >
                                <option value="">Seleccionar…</option>
                                {especialidades.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nombreEspecialidad}
                                    </option>
                                ))}
                            </Select>
                        </Campo>
                        <Campo label="Registro médico (opcional)" nombre="registroMedico" error={v.error("registroMedico")}>
                            <Input
                                value={form.registroMedico}
                                onChange={(e) => setForm((f) => ({ ...f, registroMedico: e.target.value }))}
                                maxLength={10}
                            />
                        </Campo>
                        <ResumenErrores mensaje={v.resumen} />
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={guardar} disabled={guardando}>
                            {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
