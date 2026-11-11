"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { apiFetchBlobUrl } from "@/lib/api";

interface PacienteAvatarProps {
    idPaciente: number;
    /** Ancho fijo en px; el alto se estira al 100% del contenedor padre (usar con items-stretch). */
    width?: number;
}

export function PacienteAvatar({ idPaciente, width = 72 }: PacienteAvatarProps) {
    // Foto cargada para un paciente concreto: si cambia el id, mientras llega la nueva se considera "cargando".
    const [foto, setFoto] = useState<{ id: number; url: string | null } | null>(null);
    const cargando = foto?.id !== idPaciente;
    const url = foto && foto.id === idPaciente ? foto.url : null;

    useEffect(() => {
        let cancelado = false;
        let objectUrl: string | null = null;

        apiFetchBlobUrl(`/pacientes/${idPaciente}/foto`)
            .then((u) => {
                if (cancelado) {
                    URL.revokeObjectURL(u);
                    return;
                }
                objectUrl = u;
                setFoto({ id: idPaciente, url: u });
            })
            .catch(() => {
                // sin foto cargada (404) u otro error: se muestra el ícono
                if (!cancelado) setFoto({ id: idPaciente, url: null });
            });

        return () => {
            cancelado = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [idPaciente]);

    return (
        <div
            className="flex shrink-0 items-center justify-center self-stretch overflow-hidden rounded-md border bg-muted/40"
            style={{ width, borderColor: "var(--border-default)" }}
        >
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
                <UserRound
                    size={width * 0.45}
                    className={cargando ? "text-muted-foreground/30" : "text-muted-foreground/60"}
                />
            )}
        </div>
    );
}
