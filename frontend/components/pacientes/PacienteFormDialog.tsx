"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { apiFetchMultipart, ApiError } from "@/lib/api";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";

export interface Paciente {
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

export interface TipoIdentificacion {
    id: string;
    nombreTipoIdentificacion: string;
}

interface PacienteFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editando: Paciente | null;
    tiposIdentificacion: TipoIdentificacion[];
    /** Identificación sugerida para precargar (ej. lo que el usuario ya escribió en un buscador). */
    identificacionSugerida?: string;
    onSaved: (paciente: Paciente) => void;
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

export function PacienteFormDialog({
    open,
    onOpenChange,
    editando,
    tiposIdentificacion,
    identificacionSugerida,
    onSaved,
}: PacienteFormDialogProps) {
    const [form, setForm] = useState(FORM_INICIAL);
    const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        setFormError(null);
        limpiarFoto();
        if (editando) {
            setForm({
                idTipoIdentificacion: editando.idTipoIdentificacion,
                identificacion: editando.identificacion,
                primerNombre: editando.primerNombre,
                segundoNombre: editando.segundoNombre ?? "",
                primerApellido: editando.primerApellido,
                segundoApellido: editando.segundoApellido ?? "",
                sexo: editando.sexo,
                fechaNacimiento: editando.fechaNacimiento,
                direccion: editando.direccion ?? "",
                telefono: editando.telefono ?? "",
                correoElectronico: editando.correoElectronico ?? "",
                estadoCivil: editando.estadoCivil,
                codigoTipoUsuario: editando.codigoTipoUsuario,
            });
        } else {
            setForm({ ...FORM_INICIAL, identificacion: identificacionSugerida?.trim() ?? "" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editando]);

    function limpiarFoto() {
        setFotoArchivo(null);
        setFotoPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }

    function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        setFotoArchivo(archivo);
        setFotoPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(archivo);
        });
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
            let guardado: Paciente;
            if (editando) {
                // Tipo de identificación e identificación no se envían: no son editables.
                const { idTipoIdentificacion, identificacion, ...resto } = form;
                guardado = await apiFetchMultipart<Paciente>(`/pacientes/${editando.id}`, "PATCH", resto, archivoFoto);
            } else {
                guardado = await apiFetchMultipart<Paciente>("/pacientes", "POST", form, archivoFoto);
            }
            onSaved(guardado);
            onOpenChange(false);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el paciente");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editando ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
                    <DialogDescription>
                        {editando
                            ? "Actualiza los datos de contacto y demográficos del paciente."
                            : "Completa los datos para registrar un nuevo paciente en el sistema."}
                    </DialogDescription>
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
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
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
    );
}
