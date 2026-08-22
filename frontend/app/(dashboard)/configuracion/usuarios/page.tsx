"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, UserCog, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { CATEGORIAS_PERMISOS } from "./permisos-config";

interface Empleado {
    id: number;
    nombreEmpleado: string;
    cargo?: { nombreCargo: string };
}

interface UsuarioSistema {
    id: number;
    idEmpleado: number;
    usuario: string;
    estado: "ACTIVO" | "INACTIVO" | "ELIMINADO";
    admin: "1" | "0";
    empleado?: Empleado;
    [permiso: string]: unknown;
}

const FORM_NUEVO_INICIAL = {
    idEmpleado: undefined as number | undefined,
    usuario: "",
    pass: "",
    admin: false,
};

export default function UsuariosSistemaPage() {
    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dialogNuevoOpen, setDialogNuevoOpen] = useState(false);
    const [formNuevo, setFormNuevo] = useState(FORM_NUEVO_INICIAL);
    const [mostrarPass, setMostrarPass] = useState(false);
    const [nuevoError, setNuevoError] = useState<string | null>(null);
    const [guardandoNuevo, setGuardandoNuevo] = useState(false);

    const [editando, setEditando] = useState<UsuarioSistema | null>(null);
    const [formEdit, setFormEdit] = useState({ usuario: "", pass: "", admin: false, activo: true });
    const [permisosEdit, setPermisosEdit] = useState<Record<string, boolean>>({});
    const [editError, setEditError] = useState<string | null>(null);
    const [guardandoEdit, setGuardandoEdit] = useState(false);

    const cargar = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [usuariosData, empleadosData] = await Promise.all([
                api.get<UsuarioSistema[]>("/users"),
                api.get<Empleado[]>("/seguridad/empleados/activos"),
            ]);
            setUsuarios(usuariosData);
            setEmpleados(empleadosData);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de usuarios");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // Solo empleados que aún no tienen cuenta (regla real: un usuario por empleado)
    const empleadosDisponibles = useMemo(() => {
        const idsConUsuario = new Set(usuarios.map((u) => u.idEmpleado));
        return empleados.filter((e) => !idsConUsuario.has(e.id));
    }, [empleados, usuarios]);

    function abrirNuevo() {
        setFormNuevo(FORM_NUEVO_INICIAL);
        setNuevoError(null);
        setMostrarPass(false);
        setDialogNuevoOpen(true);
    }

    async function guardarNuevo() {
        if (!formNuevo.idEmpleado || !formNuevo.usuario) {
            setNuevoError("Debe seleccionar el empleado y el campo Usuario es obligatorio.");
            return;
        }
        if (!formNuevo.pass) {
            setNuevoError("El campo Clave es obligatorio.");
            return;
        }
        setGuardandoNuevo(true);
        setNuevoError(null);
        try {
            await api.post("/users", formNuevo);
            setDialogNuevoOpen(false);
            await cargar();
        } catch (err) {
            setNuevoError(err instanceof ApiError ? err.message : "No se pudo registrar el usuario");
        } finally {
            setGuardandoNuevo(false);
        }
    }

    function abrirEditar(u: UsuarioSistema) {
        setEditando(u);
        setFormEdit({ usuario: u.usuario, pass: "", admin: u.admin === "1", activo: u.estado === "ACTIVO" });
        const permisos: Record<string, boolean> = {};
        for (const cat of CATEGORIAS_PERMISOS) {
            for (const p of cat.permisos) {
                permisos[p.key] = u[p.key] === "1";
            }
        }
        setPermisosEdit(permisos);
        setEditError(null);
    }

    async function guardarEdicion() {
        if (!editando) return;
        if (!formEdit.usuario) {
            setEditError("El campo Usuario es obligatorio.");
            return;
        }
        setGuardandoEdit(true);
        setEditError(null);
        try {
            const payload: Record<string, unknown> = {
                usuario: formEdit.usuario,
                admin: formEdit.admin,
                activo: formEdit.activo,
                permisos: permisosEdit,
            };
            if (formEdit.pass) payload.pass = formEdit.pass;
            await api.patch(`/users/${editando.id}`, payload);
            setEditando(null);
            await cargar();
        } catch (err) {
            setEditError(err instanceof ApiError ? err.message : "No se pudo guardar el usuario");
        } finally {
            setGuardandoEdit(false);
        }
    }

    function toggleTodaCategoria(keys: string[], valor: boolean) {
        setPermisosEdit((prev) => {
            const next = { ...prev };
            for (const k of keys) next[k] = valor;
            return next;
        });
    }

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Configuración
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Usuarios de Sistema</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Registro de usuarios y gestión de privilegios de acceso
                    </p>
                </div>
                <Button size="sm" onClick={abrirNuevo}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empleado</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead className="text-center">Admin</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && usuarios.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                                    No hay usuarios de sistema registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {usuarios.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.empleado?.nombreEmpleado ?? `#${u.idEmpleado}`}</TableCell>
                                <TableCell>{u.empleado?.cargo?.nombreCargo ?? "—"}</TableCell>
                                <TableCell>{u.usuario}</TableCell>
                                <TableCell className="text-center">
                                    {u.admin === "1" && <Badge>Admin</Badge>}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={u.estado === "ACTIVO" ? "default" : "destructive"}>
                                        {u.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => abrirEditar(u)}>
                                        <UserCog className="mr-1.5 h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Registro de Usuarios (frmUsers.vb) */}
            <Dialog open={dialogNuevoOpen} onOpenChange={setDialogNuevoOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registro de Usuarios</DialogTitle>
                        <DialogDescription>Cada empleado puede tener una única cuenta de usuario.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Empleado</label>
                            <select
                                className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                                value={formNuevo.idEmpleado ?? ""}
                                onChange={(e) => setFormNuevo((f) => ({ ...f, idEmpleado: Number(e.target.value) || undefined }))}
                            >
                                <option value="">Seleccionar…</option>
                                {empleadosDisponibles.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.nombreEmpleado} {e.cargo?.nombreCargo ? `— ${e.cargo.nombreCargo}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Usuario</label>
                            <Input
                                value={formNuevo.usuario}
                                onChange={(e) => setFormNuevo((f) => ({ ...f, usuario: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Clave</label>
                            <div className="relative">
                                <Input
                                    type={mostrarPass ? "text" : "password"}
                                    value={formNuevo.pass}
                                    onChange={(e) => setFormNuevo((f) => ({ ...f, pass: e.target.value }))}
                                    className="pr-9"
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarPass((v) => !v)}
                                    className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground"
                                    tabIndex={-1}
                                >
                                    {mostrarPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-[12.5px] font-medium">
                            <input
                                type="checkbox"
                                checked={formNuevo.admin}
                                onChange={(e) => setFormNuevo((f) => ({ ...f, admin: e.target.checked }))}
                            />
                            Administrador (todos los permisos)
                        </label>
                        {nuevoError && <p className="text-sm text-red-600">{nuevoError}</p>}
                    </div>
                    <DialogFooter>
                        <Button onClick={guardarNuevo} disabled={guardandoNuevo}>
                            {guardandoNuevo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edición + Privilegios (frmPrivilegios.vb) */}
            <Dialog open={!!editando} onOpenChange={(open) => !open && setEditando(null)}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editando?.empleado?.nombreEmpleado} — {editando?.empleado?.cargo?.nombreCargo}
                        </DialogTitle>
                        <DialogDescription>Datos de acceso y privilegios del sistema</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3 border-b pb-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Usuario</label>
                            <Input
                                value={formEdit.usuario}
                                onChange={(e) => setFormEdit((f) => ({ ...f, usuario: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12.5px] font-medium">Nueva clave (opcional)</label>
                            <Input
                                type="password"
                                value={formEdit.pass}
                                onChange={(e) => setFormEdit((f) => ({ ...f, pass: e.target.value }))}
                                placeholder="Dejar en blanco para no cambiarla"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-[12.5px] font-medium">
                            <input
                                type="checkbox"
                                checked={formEdit.admin}
                                onChange={(e) => setFormEdit((f) => ({ ...f, admin: e.target.checked }))}
                            />
                            Administrador
                        </label>
                        <label className="flex items-center gap-2 text-[12.5px] font-medium">
                            <input
                                type="checkbox"
                                checked={formEdit.activo}
                                onChange={(e) => setFormEdit((f) => ({ ...f, activo: e.target.checked }))}
                            />
                            Usuario activo
                        </label>
                    </div>

                    <div className="space-y-4 py-2">
                        <p className="text-sm font-medium">Privilegios</p>
                        <div className="grid grid-cols-2 gap-4">
                            {CATEGORIAS_PERMISOS.map((cat) => {
                                const keys = cat.permisos.map((p) => p.key);
                                const todosMarcados = keys.every((k) => permisosEdit[k]);
                                return (
                                    <div key={cat.titulo} className="rounded-md border p-3" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                                                {cat.titulo}
                                            </p>
                                            <button
                                                type="button"
                                                className="text-[11px] text-primary hover:underline"
                                                onClick={() => toggleTodaCategoria(keys, !todosMarcados)}
                                            >
                                                {todosMarcados ? "Ninguno" : "Todos"}
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {cat.permisos.map((p) => (
                                                <label key={p.key} className="flex items-center gap-2 text-[12.5px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!permisosEdit[p.key]}
                                                        onChange={(e) =>
                                                            setPermisosEdit((prev) => ({ ...prev, [p.key]: e.target.checked }))
                                                        }
                                                    />
                                                    {p.label}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {editError && <p className="text-sm text-red-600">{editError}</p>}
                    <DialogFooter>
                        <Button onClick={guardarEdicion} disabled={guardandoEdit}>
                            {guardandoEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
