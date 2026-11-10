"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, Loader2, Pencil, Plus, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";

interface Subentidad {
    id: number;
    idContrato: number;
    nombre: string;
    estado: "A" | "I" | "E";
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contrato: { id: number; nombre: string } | null;
}

/** Subentidades del contrato (frmSubEntidades): sin al menos una activa no se pueden crear órdenes con el contrato. */
export function SubentidadesDialog({ open, onOpenChange, contrato }: Props) {
    const [lista, setLista] = useState<Subentidad[]>([]);
    const [cargando, setCargando] = useState(false);
    const [nuevo, setNuevo] = useState("");
    const [editando, setEditando] = useState<{ id: number; nombre: string } | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        if (!contrato) return;
        setCargando(true);
        try {
            setLista(await api.get<Subentidad[]>(`/entidades-contratos/subentidades?idContrato=${contrato.id}&todas=1`));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudieron cargar las subentidades");
        } finally {
            setCargando(false);
        }
    }, [contrato]);

    useEffect(() => {
        if (open) {
            setNuevo("");
            setEditando(null);
            setError(null);
            cargar();
        }
    }, [open, cargar]);

    async function crear() {
        if (!contrato || !nuevo.trim()) return;
        setGuardando(true);
        setError(null);
        try {
            await api.post("/entidades-contratos/subentidades", { idContrato: contrato.id, nombre: nuevo });
            setNuevo("");
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo crear");
        } finally {
            setGuardando(false);
        }
    }

    async function renombrar() {
        if (!editando) return;
        setGuardando(true);
        setError(null);
        try {
            await api.patch(`/entidades-contratos/subentidades/${editando.id}`, { nombre: editando.nombre });
            setEditando(null);
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo actualizar");
        } finally {
            setGuardando(false);
        }
    }

    async function toggle(s: Subentidad) {
        try {
            await api.patch(`/entidades-contratos/subentidades/${s.id}/estado/${s.estado === "A" ? "I" : "A"}`);
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo cambiar el estado");
        }
    }

    const activas = lista.filter((s) => s.estado === "A").length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Subentidades</DialogTitle>
                    <DialogDescription>
                        {contrato?.nombre} · {activas} activa{activas === 1 ? "" : "s"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2">
                    <Input
                        placeholder="Nombre de la nueva subentidad (ej. NUEVA EPS, PARTICULAR)"
                        value={nuevo}
                        maxLength={60}
                        onChange={(e) => setNuevo(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && crear()}
                    />
                    <Button onClick={crear} disabled={guardando || !nuevo.trim()}>
                        {guardando ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                        Agregar
                    </Button>
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}

                <div className="max-h-80 overflow-auto rounded-md border">
                    {cargando ? (
                        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                        </p>
                    ) : lista.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            Este contrato no tiene subentidades. Agregue al menos una para poder registrar órdenes.
                        </p>
                    ) : (
                        <ul className="divide-y">
                            {lista.map((s) => (
                                <li key={s.id} className="flex items-center gap-2 px-3 py-2">
                                    {editando?.id === s.id ? (
                                        <>
                                            <Input
                                                autoFocus
                                                value={editando.nombre}
                                                maxLength={60}
                                                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                                                onKeyDown={(e) => e.key === "Enter" && renombrar()}
                                            />
                                            <Button size="sm" onClick={renombrar} disabled={guardando}>
                                                <Save size={14} />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditando(null)}>
                                                <X size={14} />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex-1 text-sm">{s.nombre}</span>
                                            <Badge variant={s.estado === "A" ? "default" : "destructive"} className={s.estado === "A" ? "border-green-200 bg-green-100 text-green-700" : ""}>
                                                {s.estado === "A" ? "Activa" : "Inactiva"}
                                            </Badge>
                                            <Button variant="ghost" size="sm" title="Renombrar" onClick={() => setEditando({ id: s.id, nombre: s.nombre })}>
                                                <Pencil className="h-3.5 w-3.5" style={{ color: "#D97706" }} />
                                            </Button>
                                            <Button variant="ghost" size="sm" title={s.estado === "A" ? "Desactivar" : "Activar"} onClick={() => toggle(s)}>
                                                {s.estado === "A" ? (
                                                    <Ban className="h-3.5 w-3.5" style={{ color: "#DC2626" }} />
                                                ) : (
                                                    <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#059669" }} />
                                                )}
                                            </Button>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
