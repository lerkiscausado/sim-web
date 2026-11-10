"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idOrden: number | null;
    correoPaciente?: string;
    estudio?: string;
    consecutivo?: string;
}

/** Enviar Reporte (frmMail): envía el informe en PDF al correo del paciente. */
export function CorreoDialog({ open, onOpenChange, idOrden, correoPaciente, estudio, consecutivo }: Props) {
    const [para, setPara] = useState("");
    const [asunto, setAsunto] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);
    const [configurado, setConfigurado] = useState<boolean | null>(null);

    useEffect(() => {
        if (!open) return;
        setPara(correoPaciente ?? "");
        setAsunto(`Reporte: ${estudio ?? "Estudio"}${consecutivo ? ` No. ${consecutivo}` : ""}`);
        setMensaje(
            "Cordial saludo.\n\nAdjuntamos el resultado de su estudio.\n\nCLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA",
        );
        setError(null);
        setOk(null);
        api.get<{ configurado: boolean }>("/admisiones/consulta/correo/estado")
            .then((r) => setConfigurado(r.configurado))
            .catch(() => setConfigurado(null));
    }, [open, correoPaciente, estudio, consecutivo]);

    async function enviar() {
        if (!idOrden) return;
        setEnviando(true);
        setError(null);
        setOk(null);
        try {
            const r = await api.post<{ para: string[] }>(`/admisiones/consulta/${idOrden}/correo`, { para, asunto, mensaje });
            setOk(`Reporte enviado a ${r.para.join(", ")}`);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo enviar el correo");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Enviar Reporte
                    </DialogTitle>
                    <DialogDescription>Se adjunta el informe en PDF de la orden {consecutivo ?? idOrden}.</DialogDescription>
                </DialogHeader>
                {configurado === false && (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-[12.5px] text-amber-800">
                        El servidor de correo no está configurado. El administrador debe definir SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y
                        SMTP_FROM en el archivo backend/.env.
                    </p>
                )}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[12.5px] font-medium">Para</label>
                        <Input value={para} onChange={(e) => setPara(e.target.value)} placeholder="correo@ejemplo.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12.5px] font-medium">Asunto</label>
                        <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[12.5px] font-medium">Mensaje</label>
                        <Textarea rows={5} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
                    </div>
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
                {ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-[12.5px] text-emerald-800">{ok}</p>}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Descartar
                    </Button>
                    <Button onClick={enviar} disabled={enviando || !para.trim() || configurado === false}>
                        {enviando ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                        Enviar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
