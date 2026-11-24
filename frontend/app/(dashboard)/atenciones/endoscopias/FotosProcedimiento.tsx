"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ChevronLeft, ChevronRight, ImageOff, Loader2, Trash2, Aperture } from "lucide-react";
import { api, ApiError, apiFetchBlobUrl, apiFetchMultipart } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";

/**
 * Fotos del reporte de procedimiento (endoscopia, colonoscopia, rectoscopia, estudios especiales).
 * Reemplaza frmImagenesVideo (captura) + frmImagenesCapturadas (selección para el informe) del
 * escritorio: el video del endoscopio entra por la tarjeta de captura, que el navegador ve como
 * una cámara. Máximo 30 capturas por estudio y 9 en el informe. No aplica a historias clínicas.
 */

interface Imagen {
    id: number;
    texto: string;
    enInforme: boolean;
    ordenInforme: number | null;
}
interface ListaImagenes {
    maxCapturas: number;
    maxEnInforme: number;
    imagenes: Imagen[];
}

const CLAVE_CAMARA = "sim_camara_endoscopia";

function camaraGuardada() {
    try {
        return window.localStorage.getItem(CLAVE_CAMARA) ?? "";
    } catch {
        return "";
    }
}

function escribiendo(el: Element | null) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable;
}

export function FotosProcedimiento({ idDetalleOrden, soloLectura }: { idDetalleOrden: number; soloLectura: boolean }) {
    const { avisar, confirmar } = useFeedback();
    const [lista, setLista] = useState<ListaImagenes | null>(null);
    const [miniaturas, setMiniaturas] = useState<Record<number, string | null>>({});
    const [textos, setTextos] = useState<Record<number, string>>({});
    const [ocupado, setOcupado] = useState(false);

    // Cámara
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [camaras, setCamaras] = useState<MediaDeviceInfo[]>([]);
    const [camaraId, setCamaraId] = useState<string>("");
    const [encendida, setEncendida] = useState(false);
    const [errorCamara, setErrorCamara] = useState<string | null>(null);
    const [capturando, setCapturando] = useState(false);
    const [flash, setFlash] = useState(false);
    const soportaCamara = typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

    const total = lista?.imagenes.length ?? 0;
    const maxCapturas = lista?.maxCapturas ?? 30;
    const maxInforme = lista?.maxEnInforme ?? 9;
    const enInforme = (lista?.imagenes ?? []).filter((i) => i.enInforme).sort((a, b) => (a.ordenInforme ?? 99) - (b.ordenInforme ?? 99));
    const visibles = soloLectura ? enInforme : (lista?.imagenes ?? []);

    const aplicarLista = useCallback((l: ListaImagenes) => {
        setLista(l);
        setTextos(Object.fromEntries(l.imagenes.map((i) => [i.id, i.texto])));
    }, []);

    const cargar = useCallback(async () => {
        try {
            aplicarLista(await api.get<ListaImagenes>(`/atenciones/endoscopias/detalle-orden/${idDetalleOrden}/imagenes`));
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudieron cargar las fotos");
        }
    }, [idDetalleOrden, aplicarLista, avisar]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // Miniaturas: se piden con el token (no sirven como <img src> directo) y se liberan al salir.
    const miniaturasRef = useRef(miniaturas);
    miniaturasRef.current = miniaturas;
    useEffect(() => {
        const faltan = (lista?.imagenes ?? []).filter((i) => !(i.id in miniaturasRef.current));
        faltan.forEach((i) => {
            setMiniaturas((m) => ({ ...m, [i.id]: m[i.id] ?? null }));
            apiFetchBlobUrl(`/atenciones/endoscopias/imagenes/${i.id}/archivo`)
                .then((url) => setMiniaturas((m) => ({ ...m, [i.id]: url })))
                .catch(() => setMiniaturas((m) => ({ ...m, [i.id]: "" })));
        });
    }, [lista]);
    useEffect(
        () => () => {
            Object.values(miniaturasRef.current).forEach((u) => u && URL.revokeObjectURL(u));
        },
        [],
    );

    // ── Cámara ──
    const apagar = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
        setEncendida(false);
    }, []);

    useEffect(() => apagar, [apagar]);
    useEffect(() => {
        if (soloLectura) apagar();
    }, [soloLectura, apagar]);

    const encender = useCallback(
        async (id?: string) => {
            setErrorCamara(null);
            apagar();
            const elegido = id ?? (camaraId || camaraGuardada());
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        ...(elegido ? { deviceId: { exact: elegido } } : {}),
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                    audio: false,
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play().catch(() => undefined);
                }
                const dispositivos = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
                setCamaras(dispositivos);
                const actual = stream.getVideoTracks()[0]?.getSettings().deviceId ?? "";
                setCamaraId(actual);
                try {
                    window.localStorage.setItem(CLAVE_CAMARA, actual);
                } catch {
                    /* sin almacenamiento */
                }
                setEncendida(true);
            } catch (err) {
                const nombre = (err as DOMException)?.name;
                if (elegido && nombre === "OverconstrainedError") {
                    // La cámara recordada ya no está conectada: se intenta con la predeterminada.
                    try {
                        window.localStorage.removeItem(CLAVE_CAMARA);
                    } catch {
                        /* sin almacenamiento */
                    }
                    setCamaraId("");
                    return encender("");
                }
                setErrorCamara(
                    nombre === "NotAllowedError"
                        ? "El navegador no tiene permiso para usar la cámara. Permítalo en el ícono de la barra de direcciones."
                        : nombre === "NotFoundError"
                          ? "No se encontró ninguna cámara ni tarjeta de captura conectada a este equipo."
                          : nombre === "NotReadableError"
                            ? "La cámara está siendo usada por otro programa. Ciérrelo e intente de nuevo."
                            : "No se pudo encender la cámara.",
                );
            }
        },
        [apagar, camaraId],
    );

    const capturar = useCallback(async () => {
        const video = videoRef.current;
        if (!video || !encendida || capturando || soloLectura) return;
        if (total >= maxCapturas) {
            avisar.advertencia(`Ya hay ${maxCapturas} fotos en este estudio. Elimine alguna para capturar otra.`);
            return;
        }
        if (!video.videoWidth) return;
        setCapturando(true);
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
        try {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d")?.drawImage(video, 0, 0);
            const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
            if (!blob) throw new Error("captura vacía");
            const archivo = new File([blob], `captura-${Date.now()}.jpg`, { type: "image/jpeg" });
            await apiFetchMultipart(`/atenciones/endoscopias/detalle-orden/${idDetalleOrden}/imagenes`, "POST", {}, { fieldName: "imagen", file: archivo });
            await cargar();
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo guardar la foto");
        } finally {
            setCapturando(false);
        }
    }, [encendida, capturando, soloLectura, total, maxCapturas, idDetalleOrden, cargar, avisar]);

    // Atajo: F8 o barra espaciadora (los pedales USB envían una tecla). No interfiere al escribir.
    useEffect(() => {
        if (!encendida) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "F8" || (e.code === "Space" && !escribiendo(document.activeElement))) {
                e.preventDefault();
                capturar();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [encendida, capturar]);

    // ── Galería ──
    async function cambiar(id: number, cambios: { enInforme?: boolean; texto?: string }) {
        setOcupado(true);
        try {
            aplicarLista(await api.patch<ListaImagenes>(`/atenciones/endoscopias/imagenes/${id}`, cambios));
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo actualizar la foto");
            await cargar();
        } finally {
            setOcupado(false);
        }
    }

    async function guardarTexto(img: Imagen) {
        const t = (textos[img.id] ?? "").trim();
        if (t === img.texto) return;
        await cambiar(img.id, { texto: t });
    }

    async function mover(id: number, delta: number) {
        const ids = enInforme.map((i) => i.id);
        const p = ids.indexOf(id);
        const q = p + delta;
        if (p < 0 || q < 0 || q >= ids.length) return;
        [ids[p], ids[q]] = [ids[q], ids[p]];
        setOcupado(true);
        try {
            aplicarLista(await api.put<ListaImagenes>(`/atenciones/endoscopias/detalle-orden/${idDetalleOrden}/imagenes/orden`, { ids }));
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo cambiar el orden");
        } finally {
            setOcupado(false);
        }
    }

    async function eliminar(img: Imagen) {
        const ok = await confirmar({
            titulo: "¿Eliminar la foto?",
            mensaje: img.enInforme ? "La foto está en el informe; también se quitará de él." : "La foto se quitará de la galería del estudio.",
            textoAceptar: "Eliminar",
            peligro: true,
        });
        if (!ok) return;
        setOcupado(true);
        try {
            aplicarLista(await api.delete<ListaImagenes>(`/atenciones/endoscopias/imagenes/${img.id}`));
        } catch (err) {
            avisar.error(err instanceof ApiError ? err.message : "No se pudo eliminar la foto");
        } finally {
            setOcupado(false);
        }
    }

    return (
        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-bold">
                    <Camera className="h-4 w-4" />
                    Fotos del procedimiento
                </p>
                <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                    {soloLectura
                        ? `${enInforme.length} en el informe`
                        : `${total} / ${maxCapturas} capturas · ${enInforme.length} / ${maxInforme} en el informe`}
                </p>
            </div>

            {!soloLectura && (
                <div className="mb-4 space-y-2">
                    {!soportaCamara ? (
                        <p className="rounded-md px-3 py-2 text-[12.5px]" style={{ background: "var(--status-warning-bg, #fffbeb)", color: "var(--status-warning, #92400e)" }}>
                            Este navegador no permite usar la cámara aquí. Chrome solo la habilita si el sistema se abre con <b>https://</b> o
                            desde <b>localhost</b> en el mismo equipo de la tarjeta de captura.
                        </p>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                {encendida ? (
                                    <Button type="button" variant="outline" size="sm" onClick={apagar}>
                                        <CameraOff className="mr-1 h-4 w-4" />
                                        Apagar cámara
                                    </Button>
                                ) : (
                                    <Button type="button" variant="outline" size="sm" onClick={() => encender()}>
                                        <Camera className="mr-1 h-4 w-4" />
                                        Encender cámara
                                    </Button>
                                )}
                                {camaras.length > 1 && (
                                    <Select className="max-w-xs" value={camaraId} onChange={(e) => encender(e.target.value)} aria-label="Cámara o tarjeta de captura">
                                        {camaras.map((c, i) => (
                                            <option key={c.deviceId} value={c.deviceId}>
                                                {c.label || `Cámara ${i + 1}`}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                                {encendida && (
                                    <Button type="button" size="sm" onClick={capturar} disabled={capturando || total >= maxCapturas}>
                                        {capturando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Aperture className="mr-1 h-4 w-4" />}
                                        Capturar
                                    </Button>
                                )}
                                {encendida && <span className="text-[12px] text-muted-foreground">Atajo: F8 o barra espaciadora (sirve con pedal USB)</span>}
                            </div>
                            {errorCamara && (
                                <p className="rounded-md px-3 py-2 text-[12.5px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>
                                    {errorCamara}
                                </p>
                            )}
                            <div className={encendida ? "relative overflow-hidden rounded-md bg-black" : "hidden"}>
                                <video ref={videoRef} muted playsInline className="mx-auto block max-h-[420px] w-full object-contain" />
                                {flash && <div className="pointer-events-none absolute inset-0 bg-white/70" />}
                            </div>
                        </>
                    )}
                </div>
            )}

            {visibles.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">
                    {soloLectura ? "El informe no tiene fotos." : "Aún no hay fotos. Encienda la cámara y capture durante el procedimiento."}
                </p>
            ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {visibles.map((img) => {
                        const url = miniaturas[img.id];
                        const pos = img.enInforme ? enInforme.findIndex((x) => x.id === img.id) : -1;
                        return (
                            <div
                                key={img.id}
                                className="overflow-hidden rounded-md border"
                                style={{ borderColor: img.enInforme ? "var(--accent-primary, #dc2626)" : "var(--border-default)", borderWidth: img.enInforme ? 2 : 1 }}
                            >
                                <div className="relative aspect-[4/3] bg-black">
                                    {url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={url} alt={img.texto || `Foto ${img.id}`} className="h-full w-full object-contain" />
                                    ) : url === "" ? (
                                        <div className="flex h-full flex-col items-center justify-center gap-1 text-[11px] text-white/70">
                                            <ImageOff className="h-5 w-5" />
                                            Archivo no disponible
                                        </div>
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                                        </div>
                                    )}
                                    {img.enInforme && (
                                        <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">{pos + 1}</span>
                                    )}
                                </div>
                                <div className="space-y-1.5 p-2">
                                    {soloLectura ? (
                                        <p className="min-h-[1.25rem] text-[12px]">{img.texto || <span className="text-muted-foreground">Sin leyenda</span>}</p>
                                    ) : (
                                        <>
                                            <label className="flex items-center gap-1.5 text-[12px] font-medium">
                                                <input
                                                    type="checkbox"
                                                    checked={img.enInforme}
                                                    disabled={ocupado || (!img.enInforme && enInforme.length >= maxInforme)}
                                                    onChange={(e) => cambiar(img.id, { enInforme: e.target.checked })}
                                                />
                                                En el informe
                                            </label>
                                            <Input
                                                className="h-8 text-[12px]"
                                                maxLength={100}
                                                placeholder="Leyenda (opcional)"
                                                value={textos[img.id] ?? ""}
                                                onChange={(e) => setTextos((t) => ({ ...t, [img.id]: e.target.value }))}
                                                onBlur={() => guardarTexto(img)}
                                                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-1">
                                                    {img.enInforme && (
                                                        <>
                                                            <Button type="button" variant="ghost" size="icon-xs" title="Antes en el informe" disabled={ocupado || pos <= 0} onClick={() => mover(img.id, -1)}>
                                                                <ChevronLeft />
                                                            </Button>
                                                            <Button type="button" variant="ghost" size="icon-xs" title="Después en el informe" disabled={ocupado || pos >= enInforme.length - 1} onClick={() => mover(img.id, 1)}>
                                                                <ChevronRight />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                                <Button type="button" variant="ghost" size="icon-xs" title="Eliminar foto" disabled={ocupado} onClick={() => eliminar(img)}>
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
