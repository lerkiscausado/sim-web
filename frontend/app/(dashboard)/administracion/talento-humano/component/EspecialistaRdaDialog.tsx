"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Campo } from "@/components/ui/campo";
import { useFeedback } from "@/components/ui/feedback";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DatosRda {
    idEspecialista: number;
    nombre: string;
    idTipoIdentificacion: string;
    identificacion: string;
    primerNombre: string;
    segundoNombre: string;
    primerApellido: string;
    segundoApellido: string;
    completo: boolean;
}

const TIPOS = [
    ["CC", "Cédula de ciudadanía"],
    ["CE", "Cédula de extranjería"],
    ["PA", "Pasaporte"],
    ["PT", "Permiso por protección temporal"],
    ["PE", "Permiso especial de permanencia"],
    ["TI", "Tarjeta de identidad"],
    ["DE", "Documento extranjero"],
] as const;

/**
 * Identificación y nombre estructurado del especialista (PractitionerRDA). Deben coincidir
 * con RETHUS o MinSalud rechaza el RDA. Réplica de lo que agregó frmEmpleados del escritorio.
 */
export function EspecialistaRdaDialog({
    idEmpleado,
    nombreEmpleado,
    onOpenChange,
}: {
    idEmpleado: number | null;
    nombreEmpleado: string;
    onOpenChange: (open: boolean) => void;
}) {
    const { avisar } = useFeedback();
    const [datos, setDatos] = useState<DatosRda | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (idEmpleado == null) return;
        setDatos(null);
        setError(null);
        setCargando(true);
        api.get<DatosRda>(`/seguridad/especialistas/${idEmpleado}/rda`)
            .then(setDatos)
            .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los datos"))
            .finally(() => setCargando(false));
    }, [idEmpleado]);

    async function guardar() {
        if (!datos || idEmpleado == null) return;
        setGuardando(true);
        setError(null);
        try {
            const { idTipoIdentificacion, identificacion, primerNombre, segundoNombre, primerApellido, segundoApellido } = datos;
            setDatos(
                await api.put<DatosRda>(`/seguridad/especialistas/${idEmpleado}/rda`, {
                    idTipoIdentificacion,
                    identificacion: identificacion.trim(),
                    primerNombre,
                    segundoNombre: segundoNombre || undefined,
                    primerApellido,
                    segundoApellido: segundoApellido || undefined,
                }),
            );
            avisar.exito("Datos RDA del especialista guardados.");
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudieron guardar los datos");
        } finally {
            setGuardando(false);
        }
    }

    const campo = (k: keyof DatosRda) => ({
        value: String(datos?.[k] ?? ""),
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setDatos((d) => (d ? { ...d, [k]: e.target.value } : d)),
    });

    return (
        <Dialog open={idEmpleado != null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Datos RDA — {nombreEmpleado}</DialogTitle>
                    <DialogDescription>
                        Identificación y nombres como aparecen en RETHUS. MinSalud rechaza el RDA si no coinciden.
                    </DialogDescription>
                </DialogHeader>
                {cargando && <Loader2 className="mx-auto h-5 w-5 animate-spin" />}
                {datos && (
                    <div className="grid grid-cols-2 gap-3 py-2">
                        <Campo label="Tipo de identificación" nombre="idTipoIdentificacion" requerido>
                            <Select className="w-full" {...campo("idTipoIdentificacion")}>
                                <option value="">Seleccionar…</option>
                                {TIPOS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                            </Select>
                        </Campo>
                        <Campo label="Número" nombre="identificacion" requerido>
                            <Input {...campo("identificacion")} />
                        </Campo>
                        <Campo label="Primer nombre" nombre="primerNombre" requerido>
                            <Input {...campo("primerNombre")} />
                        </Campo>
                        <Campo label="Segundo nombre" nombre="segundoNombre">
                            <Input {...campo("segundoNombre")} />
                        </Campo>
                        <Campo label="Primer apellido" nombre="primerApellido" requerido>
                            <Input {...campo("primerApellido")} />
                        </Campo>
                        <Campo label="Segundo apellido" nombre="segundoApellido">
                            <Input {...campo("segundoApellido")} />
                        </Campo>
                    </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <DialogFooter>
                    <Button onClick={guardar} disabled={!datos || guardando}>
                        {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
