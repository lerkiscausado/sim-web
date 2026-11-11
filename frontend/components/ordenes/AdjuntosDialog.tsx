"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, apiFetchMultipart, ApiError } from "@/lib/api";
import { Campo } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { abrirPdf } from "@/lib/descargas";

interface Adjunto {
    id: number;
    idOrden: number;
    nombre: string | null;
    ruta: string;
    createdAt?: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idOrden: number | null;
    titulo?: string;
}

/** Datos Adjuntos de una orden (frmAdjuntos): PDFs con un nombre descriptivo. */
export function AdjuntosDialog({ open, onOpenChange, idOrden, titulo }: Props) {
    const [lista, setLista] = useState<Adjunto[]>([]);
    const [cargando, setCargando] = useState(false);
    const [nombre, setNombre] = useState("");
    const [archivo, setArchivo] = useState<File | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputKey, setInputKey] = useState(0);
    const formAdjunto = useMemo(() => ({ nombre, archivo }), [nombre, archivo]);
    const v = useValidacion(formAdjunto, {
        nombre: [reglas.requerido("El nombre del adjunto es obligatorio."), reglas.minLong(3), reglas.maxLong(100)],
        archivo: [
            reglas.requerido("Selecciona el archivo PDF."),
            (a) => (a instanceof File && a.type !== "application/pdf" && !/\.pdf$/i.test(a.name) ? "Solo se permiten archivos PDF." : null),
            (a) => (a instanceof File && a.size > 25 * 1024 * 1024 ? "El archivo supera el máximo de 25 MB." : null),
        ],
    });

    const cargar = useCallback(async () => {
        if (!idOrden) return;
        setCargando(true);
        setError(null);
        try {
            setLista(await api.get<Adjunto[]>(`/admisiones/consulta/${idOrden}/adjuntos`));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudieron cargar los adjuntos");
        } finally {
            setCargando(false);
        }
    }, [idOrden]);

    useEffect(() => {
        if (open) {
            setNombre("");
            setArchivo(null);
            cargar();
        }
    }, [open, cargar]);

    async function subir() {
        if (!idOrden) return;
        if (!v.comprobar() || !archivo) return;
        setSubiendo(true);
        setError(null);
        try {
            await apiFetchMultipart(`/admisiones/consulta/${idOrden}/adjuntos`, "POST", { nombre: nombre.trim() }, { fieldName: "archivo", file: archivo });
            setNombre("");
            setArchivo(null);
            setInputKey((k) => k + 1);
            v.reiniciar();
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo subir el adjunto");
        } finally {
            setSubiendo(false);
        }
    }

    async function eliminar(a: Adjunto) {
        if (!window.confirm(`¿Desea eliminar el archivo adjunto "${a.nombre ?? a.ruta}"?`)) return;
        try {
            await api.delete(`/admisiones/consulta/adjuntos/${a.id}`);
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo eliminar");
        }
    }

    async function ver(a: Adjunto) {
        try {
            await abrirPdf(`/admisiones/consulta/adjuntos/${a.id}/archivo`);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo abrir el adjunto");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" /> Datos Adjuntos
                    </DialogTitle>
                    <DialogDescription>{titulo ?? (idOrden ? `Orden No. ${idOrden}` : "")}</DialogDescription>
                </DialogHeader>

                <div className="grid items-start gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Campo nombre="nombre" error={v.error("nombre")}>
                        <Input placeholder="Nombre del adjunto" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} />
                    </Campo>
                    <Campo nombre="archivo" error={v.error("archivo")}>
                        <Input key={inputKey} type="file" accept="application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                    </Campo>
                    <Button onClick={subir} disabled={subiendo}>
                        {subiendo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        Adjuntar
                    </Button>
                </div>

                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}

                <div className="max-h-80 overflow-auto rounded-md border">
                    {cargando ? (
                        <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                        </p>
                    ) : lista.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Esta orden no tiene adjuntos.</p>
                    ) : (
                        <ul className="divide-y">
                            {lista.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                                    <FileText className="h-4 w-4 shrink-0 text-red-700" />
                                    <button type="button" className="min-w-0 flex-1 truncate text-left text-sm hover:underline" onClick={() => ver(a)}>
                                        {a.nombre ?? a.ruta}
                                    </button>
                                    {a.createdAt && <span className="text-xs text-muted-foreground">{a.createdAt.slice(0, 10)}</span>}
                                    <Button variant="ghost" size="sm" title="Eliminar" onClick={() => eliminar(a)}>
                                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
