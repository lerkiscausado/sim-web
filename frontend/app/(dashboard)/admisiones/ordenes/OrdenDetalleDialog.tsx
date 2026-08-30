"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarDays, IdCard, Mars, Venus, Phone } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { api, ApiError } from "@/lib/api";
import { calcularEdad, estadoTexto, type DetalleOrden } from "./types";

interface OrdenDetalle {
    id: number;
    numeroOrden: string;
    consecutivo: string;
    fechaIngreso: string;
    fechaOrden: string;
    autorizacion: string | null;
    comentarios: string | null;
    estado: string;
    paciente?: {
        id: number;
        identificacion: string;
        idTipoIdentificacion: string;
        primerNombre: string;
        segundoNombre: string | null;
        primerApellido: string;
        segundoApellido: string | null;
        sexo: string;
        fechaNacimiento: string;
        telefono: string | null;
        correoElectronico?: string | null;
    };
    contrato?: { nombre: string };
    subentidad?: { nombre: string };
    tipoEstudio?: { nombreTipoEstudio: string };
    especimen?: { nombre: string };
    sede?: { nombre: string };
    empleado?: { nombreEmpleado: string };
}

const ESTADO_ESTILOS: Record<string, { bg: string; text: string }> = {
    PENDIENTE: { bg: "#FEF3C7", text: "#92400E" },
    PROCESO: { bg: "#DBEAFE", text: "#1E40AF" },
    ATENDIDO: { bg: "#D1FAE5", text: "#065F46" },
    CANCELADO: { bg: "#FEE2E2", text: "#991B1B" },
    FACTURADO: { bg: "#EDE9FE", text: "#5B21B6" },
};

interface OrdenDetalleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idOrden: number | null;
    /** Si viene, se muestra un botón "Volver al Listado" en el pie del modal (además de cerrar con la X o clic afuera, que también dispara onOpenChange(false)). */
    mostrarVolverAlListado?: boolean;
}

export function OrdenDetalleDialog({ open, onOpenChange, idOrden, mostrarVolverAlListado }: OrdenDetalleDialogProps) {
    const [orden, setOrden] = useState<OrdenDetalle | null>(null);
    const [detalles, setDetalles] = useState<DetalleOrden[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !idOrden) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- carga datos al abrir el modal, patrón legítimo de fetch-on-open
        setLoading(true);
        setError(null);
        setOrden(null);
        setDetalles([]);
        Promise.all([
            api.get<OrdenDetalle>(`/admisiones/ordenes/${idOrden}`),
            api.get<DetalleOrden[]>(`/admisiones/ordenes/${idOrden}/detalles`),
        ])
            .then(([o, d]) => {
                setOrden(o);
                setDetalles(d);
            })
            .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la orden"))
            .finally(() => setLoading(false));
    }, [open, idOrden]);

    const p = orden?.paciente;
    const nombreCompleto = p
        ? [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ")
        : "";
    const totalOrden = detalles
        .filter((d) => estadoTexto(d.estado) !== "CANCELADO")
        .reduce((acc, d) => acc + Number(d.neto ?? d.valor ?? 0), 0);
    const estilo = orden ? ESTADO_ESTILOS[estadoTexto(orden.estado)] ?? { bg: "#F3F4F6", text: "#374151" } : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] w-full max-w-[calc(100%-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-[60vw]">
                <DialogHeader>
                    <DialogTitle>Detalle de la Orden {orden ? `— ${orden.consecutivo || orden.id}` : ""}</DialogTitle>
                    <DialogDescription>Información completa de la orden y los estudios asociados.</DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                {orden && !loading && (
                    <div className="space-y-4">
                        {p && (
                            <div className="flex items-stretch gap-3 rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
                                <PacienteAvatar idPaciente={p.id} />
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold" style={{ color: "var(--ink-primary)" }}>
                                        {nombreCompleto.toUpperCase()}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <IdCard className="h-3.5 w-3.5" />
                                        {p.idTipoIdentificacion}
                                        {p.identificacion}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        {p.sexo === "M" ? <Mars className="h-3.5 w-3.5" /> : <Venus className="h-3.5 w-3.5" />}
                                        {calcularEdad(p.fechaNacimiento)} años · {p.sexo === "M" ? "Masculino" : "Femenino"}
                                    </p>
                                    {p.telefono && (
                                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Phone className="h-3.5 w-3.5" />
                                            {p.telefono}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-sm sm:grid-cols-4" style={{ borderColor: "var(--border-default)" }}>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">No. de Orden</p>
                                <p className="font-medium">{orden.numeroOrden}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Consecutivo</p>
                                <p className="font-medium">{orden.consecutivo || orden.id}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Estado</p>
                                {estilo && (
                                    <span
                                        className="mt-0.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                        style={{ background: estilo.bg, color: estilo.text }}
                                    >
                                        {estadoTexto(orden.estado)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Fecha Ingreso</p>
                                <p className="flex items-center gap-1 font-medium">
                                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                                    {orden.fechaIngreso}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Fecha Orden</p>
                                <p className="font-medium">{orden.fechaOrden}</p>
                            </div>
                            {orden.autorizacion && (
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Autorización</p>
                                    <p className="font-medium">{orden.autorizacion}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Contrato</p>
                                <p className="font-medium">{orden.contrato?.nombre ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Sede</p>
                                <p className="font-medium">{orden.sede?.nombre ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Espécimen</p>
                                <p className="font-medium">{orden.especimen?.nombre ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tipo de Estudio</p>
                                <p className="font-medium">{orden.tipoEstudio?.nombreTipoEstudio ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Médico</p>
                                <p className="font-medium">{orden.empleado?.nombreEmpleado ?? "—"}</p>
                            </div>
                            {orden.comentarios && (
                                <div className="col-span-2 sm:col-span-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Comentarios</p>
                                    <p className="font-medium">{orden.comentarios}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-medium">Estudios</p>
                            <div className="rounded-md border" style={{ borderColor: "var(--border-default)" }}>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Código</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead className="text-right">Copago</TableHead>
                                            <TableHead className="text-right">Neto</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detalles.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-16 text-center text-sm text-muted-foreground">
                                                    Sin estudios registrados.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {detalles.map((d) => (
                                            <TableRow key={d.id}>
                                                <TableCell className="font-medium">{d.codigoCups}</TableCell>
                                                <TableCell>{d.cups?.nombreCups ?? "—"}</TableCell>
                                                <TableCell className="text-right">${Number(d.valor).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${Number(d.copago ?? 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">${Number(d.neto ?? d.valor).toLocaleString()}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={estadoTexto(d.estado) === "CANCELADO" ? "destructive" : "outline"}>
                                                        {estadoTexto(d.estado)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {detalles.length > 0 && (
                            <div className="flex justify-end">
                                <p className="text-base font-semibold">Total orden: ${totalOrden.toLocaleString()}</p>
                            </div>
                        )}
                    </div>
                )}

                {mostrarVolverAlListado && (
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Volver al Listado</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
