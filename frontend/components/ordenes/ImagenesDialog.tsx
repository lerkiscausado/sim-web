"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { apiUrl, urlImagen } from "@/lib/descargas";

interface Imagen {
    id: number;
    idOrden: number;
    ruta: string;
    texto: string | null;
}

interface Pendiente {
    id: string;
    blob: Blob;
    url: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idOrden: number | null;
    titulo?: string;
}

/**
 * Imágenes del estudio (frmImagenesVideo / frmCapturaImagenes): captura desde
 * la cámara o el microscopio conectado al equipo (getUserMedia) o carga de
 * archivos, y galería de las imágenes ya guardadas de la orden.
 */
export function ImagenesDialog({ open, onOpenChange, idOrden, titulo }: Props) {
    const [guardadas, setGuardadas] = useState<(Imagen & { url?: string })[]>([]);
    const [pendientes, setPendientes] = useState<Pendiente[]>([]);
    const [texto, setTexto] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [subiendo, setSubiendo] = useState(false);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [camaras, setCamaras] = useState<MediaDeviceInfo[]>([]);
    const [camaraId, setCamaraId] = useState<string>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const urlsRef = useRef<string[]>([]);

    const detenerCamara = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamaraActiva(false);
    }, []);

    const cargar = useCallback(async () => {
        if (!idOrden) return;
        try {
            const lista = await api.get<Imagen[]>(`/admisiones/consulta/${idOrden}/imagenes`);
            const conUrl = await Promise.all(
                lista.map(async (i) => {
                    try {
                        const url = await urlImagen(`/admisiones/consulta/imagenes/${i.id}/archivo`);
                        urlsRef.current.push(url);
                        return { ...i, url };
                    } catch {
                        return { ...i };
                    }
                }),
            );
            setGuardadas(conUrl);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudieron cargar las imágenes");
        }
    }, [idOrden]);

    useEffect(() => {
        if (open) {
            setError(null);
            setPendientes([]);
            setTexto("");
            cargar();
        } else {
            detenerCamara();
            urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
            urlsRef.current = [];
        }
    }, [open, cargar, detenerCamara]);

    async function iniciarCamara(id?: string) {
        setError(null);
        try {
            detenerCamara();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: id ? { deviceId: { exact: id }, width: { ideal: 1920 }, height: { ideal: 1080 } } : { width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            setCamaraActiva(true);
            const dispositivos = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
            setCamaras(dispositivos);
            const actual = stream.getVideoTracks()[0]?.getSettings().deviceId;
            if (actual) setCamaraId(actual);
        } catch {
            setError("No se pudo acceder a la cámara. Verifique que esté conectada y que el navegador tenga permiso.");
        }
    }

    function capturar() {
        const v = videoRef.current;
        if (!v || !v.videoWidth) return;
        const canvas = document.createElement("canvas");
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        canvas.getContext("2d")?.drawImage(v, 0, 0);
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                urlsRef.current.push(url);
                setPendientes((p) => [...p, { id: `${Date.now()}-${p.length}`, blob, url }]);
            },
            "image/jpeg",
            0.92,
        );
    }

    function agregarArchivos(files: FileList | null) {
        if (!files) return;
        const nuevos = Array.from(files)
            .filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))
            .map((f, i) => {
                const url = URL.createObjectURL(f);
                urlsRef.current.push(url);
                return { id: `${Date.now()}-f${i}`, blob: f, url };
            });
        setPendientes((p) => [...p, ...nuevos]);
    }

    async function guardar() {
        if (!idOrden || pendientes.length === 0) return;
        setSubiendo(true);
        setError(null);
        try {
            const fd = new FormData();
            pendientes.forEach((p, i) => fd.append("imagenes", p.blob, `captura-${i + 1}.${p.blob.type === "image/png" ? "png" : "jpg"}`));
            if (texto.trim()) fd.append("texto", texto.trim());
            const headers = new Headers();
            const t = window.localStorage.getItem("sim_token");
            if (t) headers.set("Authorization", `Bearer ${t}`);
            const res = await fetch(`${apiUrl}/admisiones/consulta/${idOrden}/imagenes`, { method: "POST", headers, body: fd });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new ApiError(res.status, Array.isArray(body.message) ? body.message.join(", ") : body.message ?? "Error al guardar");
            }
            setPendientes([]);
            setTexto("");
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudieron guardar las imágenes");
        } finally {
            setSubiendo(false);
        }
    }

    async function eliminar(img: Imagen) {
        if (!window.confirm("¿Desea eliminar esta imagen del estudio?")) return;
        try {
            await api.delete(`/admisiones/consulta/imagenes/${img.id}`);
            await cargar();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "No se pudo eliminar");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Camera className="h-4 w-4" /> Imágenes del Estudio
                    </DialogTitle>
                    <DialogDescription>{titulo ?? (idOrden ? `Orden No. ${idOrden}` : "")}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
                    <div className="space-y-2">
                        <div className="relative aspect-video overflow-hidden rounded-md border bg-black">
                            <video ref={videoRef} className="h-full w-full object-contain" muted playsInline />
                            {!camaraActiva && (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">Cámara apagada</div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {camaraActiva ? (
                                <>
                                    <Button onClick={capturar}>
                                        <Camera size={14} /> Capturar
                                    </Button>
                                    <Button variant="outline" onClick={detenerCamara}>
                                        <CameraOff size={14} /> Apagar
                                    </Button>
                                    {camaras.length > 1 && (
                                        <select
                                            className="h-9 rounded-md border bg-transparent px-2 text-sm"
                                            value={camaraId}
                                            onChange={(e) => iniciarCamara(e.target.value)}
                                        >
                                            {camaras.map((c, i) => (
                                                <option key={c.deviceId} value={c.deviceId}>
                                                    {c.label || `Cámara ${i + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </>
                            ) : (
                                <Button variant="outline" onClick={() => iniciarCamara()}>
                                    <Camera size={14} /> Encender cámara
                                </Button>
                            )}
                            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-muted">
                                <ImagePlus size={14} /> Cargar archivos
                                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => agregarArchivos(e.target.files)} />
                            </label>
                        </div>
                        {pendientes.length > 0 && (
                            <div className="space-y-2 rounded-md border p-2">
                                <p className="text-xs font-medium">Capturas sin guardar ({pendientes.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {pendientes.map((p) => (
                                        <div key={p.id} className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={p.url} alt="captura" className="h-20 w-28 rounded object-cover" />
                                            <button
                                                type="button"
                                                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                                                onClick={() => setPendientes((l) => l.filter((x) => x.id !== p.id))}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input placeholder="Texto / descripción (opcional)" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={100} />
                                    <Button onClick={guardar} disabled={subiendo}>
                                        {subiendo ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">Imágenes guardadas ({guardadas.length})</p>
                        <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-auto">
                            {guardadas.length === 0 && <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">Sin imágenes.</p>}
                            {guardadas.map((g) => (
                                <figure key={g.id} className="group relative overflow-hidden rounded-md border">
                                    {g.url ? (
                                        <a href={g.url} target="_blank" rel="noreferrer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={g.url} alt={g.texto ?? "imagen"} className="h-28 w-full object-cover" />
                                        </a>
                                    ) : (
                                        <div className="flex h-28 items-center justify-center p-2 text-center text-[11px] text-muted-foreground">
                                            Archivo no disponible en el servidor
                                        </div>
                                    )}
                                    <figcaption className="truncate px-1.5 py-1 text-[11px]">{g.texto || "—"}</figcaption>
                                    <button
                                        type="button"
                                        title="Eliminar"
                                        className="absolute right-1 top-1 hidden rounded bg-white/90 p-1 group-hover:block"
                                        onClick={() => eliminar(g)}
                                    >
                                        <Trash2 size={12} className="text-red-600" />
                                    </button>
                                </figure>
                            ))}
                        </div>
                    </div>
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>}
            </DialogContent>
        </Dialog>
    );
}
