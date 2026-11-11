"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Confirmaciones y avisos de la aplicación (reemplazan window.confirm / alert).
 *
 *   const { confirmar, avisar } = useFeedback();
 *   if (!(await confirmar({ titulo: "¿Eliminar?", peligro: true }))) return;
 *   avisar.exito("Estudio guardado.");
 */

export interface OpcionesConfirmar {
    titulo: string;
    mensaje?: React.ReactNode;
    textoAceptar?: string;
    textoCancelar?: string;
    /** Botón de aceptar en rojo (acciones destructivas o que no se pueden deshacer). */
    peligro?: boolean;
}

type TipoAviso = "exito" | "error" | "info" | "advertencia";
interface Aviso {
    id: number;
    tipo: TipoAviso;
    mensaje: string;
}

interface FeedbackApi {
    confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
    avisar: Record<TipoAviso, (mensaje: string) => void>;
}

const FeedbackContext = React.createContext<FeedbackApi | null>(null);

const ICONOS: Record<TipoAviso, React.ElementType> = {
    exito: CheckCircle2,
    error: XCircle,
    info: Info,
    advertencia: AlertTriangle,
};
const ESTILOS: Record<TipoAviso, string> = {
    exito: "border-emerald-200 bg-emerald-50 text-emerald-900 [&_svg]:text-emerald-600",
    error: "border-red-200 bg-red-50 text-red-900 [&_svg]:text-red-600",
    info: "border-sky-200 bg-sky-50 text-sky-900 [&_svg]:text-sky-600",
    advertencia: "border-amber-200 bg-amber-50 text-amber-900 [&_svg]:text-amber-600",
};
const DURACION: Record<TipoAviso, number> = { exito: 3500, info: 4000, advertencia: 6000, error: 7000 };

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [pendiente, setPendiente] = React.useState<(OpcionesConfirmar & { resolver: (ok: boolean) => void }) | null>(null);
    const [avisos, setAvisos] = React.useState<Aviso[]>([]);
    const siguienteId = React.useRef(1);

    const cerrarAviso = React.useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);

    const api = React.useMemo<FeedbackApi>(() => {
        const avisar = (tipo: TipoAviso) => (mensaje: string) => {
            const id = siguienteId.current++;
            setAvisos((a) => [...a.slice(-3), { id, tipo, mensaje }]);
            setTimeout(() => cerrarAviso(id), DURACION[tipo]);
        };
        return {
            confirmar: (opciones) =>
                new Promise<boolean>((resolver) => {
                    setPendiente({ ...opciones, resolver });
                }),
            avisar: { exito: avisar("exito"), error: avisar("error"), info: avisar("info"), advertencia: avisar("advertencia") },
        };
    }, [cerrarAviso]);

    function responder(ok: boolean) {
        pendiente?.resolver(ok);
        setPendiente(null);
    }

    return (
        <FeedbackContext.Provider value={api}>
            {children}

            <Dialog open={!!pendiente} onOpenChange={(abierto) => !abierto && responder(false)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {pendiente?.peligro && <AlertTriangle className="h-5 w-5 text-red-600" />}
                            {pendiente?.titulo}
                        </DialogTitle>
                        {pendiente?.mensaje && <DialogDescription className="whitespace-pre-line">{pendiente.mensaje}</DialogDescription>}
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => responder(false)}>
                            {pendiente?.textoCancelar ?? "Cancelar"}
                        </Button>
                        <Button
                            autoFocus
                            variant={pendiente?.peligro ? "destructive" : "default"}
                            onClick={() => responder(true)}
                        >
                            {pendiente?.textoAceptar ?? "Aceptar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div
                aria-live="polite"
                className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
            >
                {avisos.map((a) => {
                    const Icono = ICONOS[a.tipo];
                    return (
                        <div
                            key={a.id}
                            role={a.tipo === "error" ? "alert" : "status"}
                            className={cn(
                                "pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13.5px] shadow-lg",
                                "animate-in fade-in slide-in-from-bottom-2",
                                ESTILOS[a.tipo],
                            )}
                        >
                            <Icono className="mt-0.5 h-4 w-4 shrink-0" />
                            <p className="flex-1 leading-snug">{a.mensaje}</p>
                            <button
                                type="button"
                                aria-label="Cerrar aviso"
                                className="rounded p-0.5 opacity-60 hover:opacity-100"
                                onClick={() => cerrarAviso(a.id)}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </FeedbackContext.Provider>
    );
}

export function useFeedback(): FeedbackApi {
    const ctx = React.useContext(FeedbackContext);
    if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
    return ctx;
}
