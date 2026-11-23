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
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";
import { PAISES_NACIMIENTO, ETNIAS, DISCAPACIDADES, IDENTIDADES_GENERO } from "@/lib/rda-catalogos";

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
    zona?: "R" | "U" | null;
    codigoMunicipio?: string | null;
    nombreMunicipio?: string | null;
    codigoPaisNacimiento?: string | null;
    codigoEtnia?: string | null;
    codigoDiscapacidad?: string | null;
    codigoIdentidadGenero?: string | null;
    horaNacimiento?: string | null;
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
    // Datos RDA: mismos valores por defecto que frmUsuarios del escritorio.
    zona: "U",
    codigoMunicipio: "",
    nombreMunicipio: "",
    codigoPaisNacimiento: "170",
    codigoEtnia: "99",
    codigoDiscapacidad: "08",
    codigoIdentidadGenero: "",
    horaNacimiento: "",
};

/** Letras (con tildes y ñ), espacios, apóstrofo y guion. */
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/;

export function PacienteFormDialog({
    open,
    onOpenChange,
    editando,
    tiposIdentificacion,
    identificacionSugerida,
    onSaved,
}: PacienteFormDialogProps) {
    const { avisar } = useFeedback();
    const [form, setForm] = useState(FORM_INICIAL);
    const [fotoArchivo, setFotoArchivo] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const v = useValidacion(form, {
        idTipoIdentificacion: [reglas.requerido("Selecciona el tipo de identificación.")],
        identificacion: [
            reglas.requerido("La identificación es obligatoria."),
            reglas.maxLong(20),
            (id, f) =>
                ["CC", "TI", "RC", "NU", "CN", "MS", "AS"].includes(String(f.idTipoIdentificacion))
                    ? reglas.patron(/^\d{3,15}$/, "Para este tipo de documento solo se permiten números (3 a 15 dígitos).")(id)
                    : reglas.patron(/^[A-Za-z0-9-]{3,20}$/, "Solo letras, números y guion (3 a 20 caracteres).")(id),
        ],
        primerNombre: [reglas.requerido("El primer nombre es obligatorio."), reglas.maxLong(150), reglas.patron(SOLO_LETRAS, "Solo letras y espacios.")],
        segundoNombre: [reglas.maxLong(150), reglas.patron(SOLO_LETRAS, "Solo letras y espacios.")],
        primerApellido: [reglas.requerido("El primer apellido es obligatorio."), reglas.maxLong(150), reglas.patron(SOLO_LETRAS, "Solo letras y espacios.")],
        segundoApellido: [reglas.maxLong(150), reglas.patron(SOLO_LETRAS, "Solo letras y espacios.")],
        sexo: [reglas.requerido("Selecciona el sexo.")],
        fechaNacimiento: [
            reglas.requerido("La fecha de nacimiento es obligatoria."),
            reglas.fecha(),
            reglas.fechaNoFutura("La fecha de nacimiento no puede ser posterior a hoy."),
            reglas.patron(/^(19|20)\d{2}-/, "Revisa el año de nacimiento."),
        ],
        direccion: [reglas.maxLong(300)],
        telefono: [reglas.maxLong(150), reglas.telefono()],
        correoElectronico: [reglas.maxLong(750), reglas.email()],
        estadoCivil: [reglas.requerido("Selecciona el estado civil.")],
        codigoMunicipio: [reglas.patron(/^\d{5}$/, "Código DIVIPOLA de 5 dígitos, ej. 13001 (Cartagena).")],
        horaNacimiento: [reglas.patron(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:MM.")],
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        v.reiniciar();
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
                zona: editando.zona ?? "U",
                codigoMunicipio: (editando.codigoMunicipio ?? "").trim(),
                nombreMunicipio: editando.nombreMunicipio ?? "",
                codigoPaisNacimiento: editando.codigoPaisNacimiento || "170",
                codigoEtnia: editando.codigoEtnia || "99",
                codigoDiscapacidad: editando.codigoDiscapacidad || "08",
                codigoIdentidadGenero: editando.codigoIdentidadGenero ?? "",
                horaNacimiento: (editando.horaNacimiento ?? "").slice(0, 5),
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
        if (!v.comprobar()) return;
        setGuardando(true);
        setFormError(null);
        try {
            const archivoFoto = fotoArchivo ? { fieldName: "foto", file: fotoArchivo } : null;
            // La hora vacía no se envía (la columna es TIME).
            const datos = { ...form, horaNacimiento: form.horaNacimiento || undefined };
            let guardado: Paciente;
            if (editando) {
                // Tipo de identificación e identificación no se envían: no son editables.
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { idTipoIdentificacion, identificacion, ...resto } = datos;
                guardado = await apiFetchMultipart<Paciente>(`/pacientes/${editando.id}`, "PATCH", resto, archivoFoto);
            } else {
                guardado = await apiFetchMultipart<Paciente>("/pacientes", "POST", datos, archivoFoto);
            }
            onSaved(guardado);
            onOpenChange(false);
            avisar.exito(editando ? "Datos del paciente actualizados." : "Paciente registrado.");
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
                        style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
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
                    <Campo label="Tipo de identificación" nombre="idTipoIdentificacion" error={v.error("idTipoIdentificacion")} requerido>
                        <Select
                            className="w-full" selectClassName="disabled:opacity-60"
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
                        </Select>
                    </Campo>
                    <Campo label="Identificación" nombre="identificacion" error={v.error("identificacion")} requerido>
                        <Input
                            value={form.identificacion}
                            onChange={(e) => setForm((f) => ({ ...f, identificacion: e.target.value }))}
                            disabled={!!editando}
                        />
                    </Campo>
                    <Campo label="Primer nombre" nombre="primerNombre" error={v.error("primerNombre")} requerido>
                        <Input
                            value={form.primerNombre}
                            onChange={(e) => setForm((f) => ({ ...f, primerNombre: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Segundo nombre" nombre="segundoNombre" error={v.error("segundoNombre")}>
                        <Input
                            value={form.segundoNombre}
                            onChange={(e) => setForm((f) => ({ ...f, segundoNombre: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Primer apellido" nombre="primerApellido" error={v.error("primerApellido")} requerido>
                        <Input
                            value={form.primerApellido}
                            onChange={(e) => setForm((f) => ({ ...f, primerApellido: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Segundo apellido" nombre="segundoApellido" error={v.error("segundoApellido")}>
                        <Input
                            value={form.segundoApellido}
                            onChange={(e) => setForm((f) => ({ ...f, segundoApellido: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Sexo" nombre="sexo" error={v.error("sexo")} requerido>
                        <Select
                            className="w-full"
                            value={form.sexo}
                            onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}
                        >
                            <option value="F">Femenino</option>
                            <option value="M">Masculino</option>
                        </Select>
                    </Campo>
                    <Campo label="Fecha de nacimiento" nombre="fechaNacimiento" error={v.error("fechaNacimiento")} requerido>
                        <Input
                            type="date"
                            value={form.fechaNacimiento}
                            onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Dirección" nombre="direccion" error={v.error("direccion")} className="col-span-2">
                        <Input
                            value={form.direccion}
                            onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Teléfono" nombre="telefono" error={v.error("telefono")}>
                        <Input
                            value={form.telefono}
                            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Correo electrónico" nombre="correoElectronico" error={v.error("correoElectronico")}>
                        <Input
                            type="email"
                            value={form.correoElectronico}
                            onChange={(e) => setForm((f) => ({ ...f, correoElectronico: e.target.value }))}
                        />
                    </Campo>
                    <Campo label="Estado civil" nombre="estadoCivil" error={v.error("estadoCivil")} requerido>
                        <Select
                            className="w-full"
                            value={form.estadoCivil}
                            onChange={(e) => setForm((f) => ({ ...f, estadoCivil: e.target.value }))}
                        >
                            <option value="SOLTERO">Soltero(a)</option>
                            <option value="CASADO">Casado(a)</option>
                            <option value="UNION LIBRE">Unión libre</option>
                            <option value="DIVORCIADO">Divorciado(a)</option>
                            <option value="VIUDO">Viudo(a)</option>
                        </Select>
                    </Campo>
                    <Campo label="Zona de residencia" nombre="zona">
                        <Select className="w-full" value={form.zona} onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))}>
                            <option value="U">Urbana</option>
                            <option value="R">Rural</option>
                        </Select>
                    </Campo>
                    <Campo label="Municipio de residencia (DIVIPOLA)" nombre="codigoMunicipio" error={v.error("codigoMunicipio")}>
                        <div className="flex gap-2">
                            <Input
                                className="w-24"
                                inputMode="numeric"
                                maxLength={5}
                                placeholder="13001"
                                value={form.codigoMunicipio}
                                onChange={(e) => setForm((f) => ({ ...f, codigoMunicipio: e.target.value.replace(/\D/g, "") }))}
                            />
                            <Input
                                placeholder="Nombre (ej. Cartagena)"
                                value={form.nombreMunicipio}
                                onChange={(e) => setForm((f) => ({ ...f, nombreMunicipio: e.target.value }))}
                            />
                        </div>
                    </Campo>

                    <p className="col-span-2 mt-2 border-t pt-3 text-[12.5px] font-semibold" style={{ borderColor: "var(--border-default)" }}>
                        Datos para el RDA (MinSalud)
                    </p>
                    <Campo label="País de nacimiento" nombre="codigoPaisNacimiento">
                        <Select className="w-full" value={form.codigoPaisNacimiento} onChange={(e) => setForm((f) => ({ ...f, codigoPaisNacimiento: e.target.value }))}>
                            {PAISES_NACIMIENTO.map((p) => <option key={p.codigo} value={p.codigo}>{p.nombre}</option>)}
                        </Select>
                    </Campo>
                    <Campo label="Hora de nacimiento (opcional)" nombre="horaNacimiento" error={v.error("horaNacimiento")}>
                        <Input type="time" value={form.horaNacimiento} onChange={(e) => setForm((f) => ({ ...f, horaNacimiento: e.target.value }))} />
                    </Campo>
                    <Campo label="Pertenencia étnica" nombre="codigoEtnia">
                        <Select className="w-full" value={form.codigoEtnia} onChange={(e) => setForm((f) => ({ ...f, codigoEtnia: e.target.value }))}>
                            {ETNIAS.map((x) => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}
                        </Select>
                    </Campo>
                    <Campo label="Discapacidad" nombre="codigoDiscapacidad">
                        <Select className="w-full" value={form.codigoDiscapacidad} onChange={(e) => setForm((f) => ({ ...f, codigoDiscapacidad: e.target.value }))}>
                            {DISCAPACIDADES.map((x) => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}
                        </Select>
                    </Campo>
                    <Campo label="Identidad de género (opcional)" nombre="codigoIdentidadGenero">
                        <Select className="w-full" value={form.codigoIdentidadGenero} onChange={(e) => setForm((f) => ({ ...f, codigoIdentidadGenero: e.target.value }))}>
                            <option value="">Sin dato</option>
                            {IDENTIDADES_GENERO.map((x) => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}
                        </Select>
                    </Campo>
                </div>
                <ResumenErrores mensaje={v.resumen} />
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
