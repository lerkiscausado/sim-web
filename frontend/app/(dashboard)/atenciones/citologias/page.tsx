"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Microscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search, FileDown, PenLine, Camera } from "lucide-react";
import { abrirPdf } from "@/lib/descargas";
import { ImagenesDialog } from "@/components/ordenes/ImagenesDialog";
import { api, ApiError } from "@/lib/api";
import { Campo, ResumenErrores } from "@/components/ui/campo";
import { reglas, useValidacion } from "@/lib/validacion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { OrdenPendiente, InformeCitologia, AntecedentesTomaMuestra, EstudioAnterior } from "./types";
import { nombrePaciente, calcularEdad } from "./types";
import { hoyISO } from "@/lib/fechas";
import { useFeedback } from "@/components/ui/feedback";
import { CALIDAD_MUESTRA, CATEGORIZACION_GENERAL, MICROORGANISMOS, OHNN, CELULAS_ESCAMOSAS, CELULAS_GLANDULARES_ATIPICAS, CELULAS_GLANDULARES_NEOPLASIA, CELULAS_GLANDULARES_OTROS, FLORA_BACILAR, INFLAMACION, TODOS_LOS_CHECKS, CUELLO, FLUJO, FORM_INICIAL, ANTECEDENTES_INICIAL } from "./constantes";
import { PacienteCard, GrupoChecks } from "./componentes";
import type { ChecksState } from "./constantes";
import { usePaginacionLocal } from "@/lib/useTabla";
import { PaginationControls } from "@/components/ui/pagination-controls";

// Etiquetas clínicas reales, extraídas de frmCitologiaGeneral.Designer.vb (Properties.Caption)

type Vista = "listado" | "informe";

export default function CitologiasPage() {
    const { avisar } = useFeedback();
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState(() => ({ ...FORM_INICIAL, fechaSalida: hoyISO() }));
    const [antecedentes, setAntecedentes] = useState(ANTECEDENTES_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [guardandoAntecedentes, setGuardandoAntecedentes] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);
    const [firmar, setFirmar] = useState(false);
    const [confirmarFirma, setConfirmarFirma] = useState(false);
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const [imagenesAbierto, setImagenesAbierto] = useState(false);
    const tablaPendientes = usePaginacionLocal(pendientes, "pendientes-citologias");

    /**
     * Validación del informe. Para guardar se exige el diagnóstico; para firmar, además,
     * la calidad de la muestra y la categorización general (sistema Bethesda).
     */
    const exigirFirma = useRef(false);
    const marcados = (keys: string[]) => keys.filter((k) => form.checks[k]).length;
    const formValidar = useMemo(
        () => ({
            calidad: marcados(CALIDAD_MUESTRA.map((c) => c.key)),
            categorizacion: marcados(CATEGORIZACION_GENERAL.map((c) => c.key)),
            cm5: form.cm5,
            motivoRequerido: !!(form.checks.cm3 || form.checks.cm4),
            diagnostico: form.diagnostico,
            observaciones: form.observaciones,
            fechaSalida: form.fechaSalida,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [form],
    );
    const v = useValidacion(formValidar, {
        fechaSalida: [
            reglas.requerido("La fecha de salida es obligatoria."),
            reglas.fecha(),
            (fs) =>
                fs && ordenActiva?.fechaIngreso && String(fs).slice(0, 10) < ordenActiva.fechaIngreso.slice(0, 10)
                    ? "No puede ser anterior a la fecha de ingreso."
                    : null,
        ],
        calidad: [
            (n) => (exigirFirma.current && n === 0 ? "Marca la calidad de la muestra para poder firmar." : null),
            (n) => (Number(n) > 1 ? "Marca solo una opción de calidad de la muestra." : null),
        ],
        categorizacion: [
            (n) => (exigirFirma.current && n === 0 ? "Marca la categorización general para poder firmar." : null),
            (n) => (Number(n) > 1 ? "Marca solo una categorización general." : null),
        ],
        cm5: [reglas.si((f) => f.motivoRequerido, reglas.requerido("Especifica el motivo (muestra insatisfactoria o rechazada).")), reglas.maxLong(200)],
        diagnostico: [reglas.requerido("El diagnóstico es obligatorio.")],
    });

    const NUMERO_CORTO = reglas.patron(/^\d{1,2}$/, "Número de 0 a 99.");
    const vAnt = useValidacion(antecedentes, {
        g: [NUMERO_CORTO],
        p: [NUMERO_CORTO],
        a: [NUMERO_CORTO],
        c: [NUMERO_CORTO],
        ivsa: [reglas.numero({ min: 8, max: 70, entero: true, mensaje: "Edad no válida (8 a 70 años)." })],
        mpf: [reglas.maxLong(50)],
        fum: [reglas.maxLong(20)],
        fuc: [reglas.maxLong(20)],
        fup: [reglas.maxLong(20)],
    });

    const cargarPendientes = useCallback(async (q?: string) => {
        setLoading(true);
        setError(null);
        try {
            const qs = q ? `?q=${encodeURIComponent(q)}` : "";
            const pend = await api.get<OrdenPendiente[]>(`/atenciones/citologia/pendientes${qs}`);
            setPendientes(pend);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo cargar la información");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            cargarPendientes(searchTerm);
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    function toggleCheck(key: string, value: boolean) {
        setForm((f) => ({ ...f, checks: { ...f.checks, [key]: value } }));
    }

    function toggleAntecedenteCheck(key: string, value: boolean) {
        setAntecedentes((a) => ({ ...a, checks: { ...a.checks, [key]: value } }));
    }

    async function abrirOrden(orden: OrdenPendiente) {
        setOrdenActiva(orden);
        setFormError(null);
        v.reiniciar();
        vAnt.reiniciar();
        setForm({ ...FORM_INICIAL, fechaSalida: hoyISO() });
        setAntecedentes({ ...ANTECEDENTES_INICIAL, idUsuario: orden.idUsuario } as typeof ANTECEDENTES_INICIAL & { idUsuario: number });
        setEstudiosAnteriores([]);
        setVista("informe");

        api
            .get<EstudioAnterior[]>(`/atenciones/citologia/paciente/${orden.idUsuario}/estudios-anteriores`)
            .then(setEstudiosAnteriores)
            .catch(() => setEstudiosAnteriores([]));

        api
            .get<AntecedentesTomaMuestra | null>(`/atenciones/toma-muestra/paciente/${orden.idUsuario}`)
            .then((data) => {
                if (!data) return;
                setAntecedentes({
                    g: data.g ?? "",
                    p: data.p ?? "",
                    a: data.a ?? "",
                    c: data.c ?? "",
                    ivsa: data.ivsa ?? "",
                    mpf: data.mpf ?? "",
                    fum: data.fum ?? "",
                    fuc: data.fuc ?? "",
                    fup: data.fup ?? "",
                    checks: {
                        s: data.s === "1",
                        u: data.u === "1",
                        l: data.l === "1",
                        bn: data.bn === "1",
                        cn: data.cn === "1",
                        ba: data.ba === "1",
                        o: data.o === "1",
                    },
                    observaciones: data.observaciones ?? "",
                });
            })
            .catch(() => {
                // sin antecedentes registrados todavía
            });

        try {
            const existente = await api.get<InformeCitologia | null>(`/atenciones/citologia/orden/${orden.id}`);
            if (existente) {
                const checks: ChecksState = {};
                for (const key of TODOS_LOS_CHECKS) {
                    checks[key] = (existente as unknown as Record<string, unknown>)[key] === "1";
                }
                setForm({
                    checks,
                    cm5: existente.cm5 ?? "",
                    observaciones: existente.observaciones ?? "",
                    diagnostico: existente.diagnostico ?? "",
                    fechaSalida: hoyISO(),
                });
            }
        } catch {
            // no hay informe previo todavía, se deja el formulario en blanco
        }
    }

    function volverAlListado() {
        setVista("listado");
        setOrdenActiva(null);
        cargarPendientes(searchTerm);
    }

    async function guardarAntecedentes() {
        if (!ordenActiva || !vAnt.comprobar()) return;
        setGuardandoAntecedentes(true);
        try {
            await api.post("/atenciones/toma-muestra", {
                idUsuario: ordenActiva.idUsuario,
                g: antecedentes.g,
                p: antecedentes.p,
                a: antecedentes.a,
                c: antecedentes.c,
                ivsa: antecedentes.ivsa,
                mpf: antecedentes.mpf,
                fum: antecedentes.fum,
                fuc: antecedentes.fuc,
                fup: antecedentes.fup,
                s: antecedentes.checks.s ? "1" : "0",
                u: antecedentes.checks.u ? "1" : "0",
                l: antecedentes.checks.l ? "1" : "0",
                bn: antecedentes.checks.bn ? "1" : "0",
                cn: antecedentes.checks.cn ? "1" : "0",
                ba: antecedentes.checks.ba ? "1" : "0",
                o: antecedentes.checks.o ? "1" : "0",
                observaciones: antecedentes.observaciones,
            });
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudieron guardar los antecedentes");
        } finally {
            setGuardandoAntecedentes(false);
        }
    }

    async function guardarInforme(): Promise<boolean> {
        if (!ordenActiva) return false;
        setFormError(null);

        if (!v.comprobar()) return false;

        setGuardando(true);
        try {
            const payload: Record<string, unknown> = {
                idOrden: ordenActiva.id,
                cm5: form.cm5,
                observaciones: form.observaciones,
                diagnostico: form.diagnostico,
                fechaSalida: form.fechaSalida,
            };
            for (const key of TODOS_LOS_CHECKS) {
                payload[key] = form.checks[key] ? "1" : "0";
            }
            await api.post("/atenciones/citologia", payload);
            avisar.exito("Informe guardado.");
            return true;
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el informe");
            return false;
        } finally {
            setGuardando(false);
        }
    }

    async function onGuardar() {
        exigirFirma.current = firmar;
        const ok = await guardarInforme();
        if (ok && firmar) setConfirmarFirma(true);
    }

    /** chkFirmarEstudio: firma y cierra el estudio (la orden pasa a ATENDIDO). */
    async function firmarEstudio() {
        if (!ordenActiva) return;
        setConfirmarFirma(false);
        setGuardando(true);
        try {
            await api.post(`/atenciones/citologia/orden/${ordenActiva.id}/firmar`);
            avisar.exito("Estudio firmado. La orden pasó a ATENDIDO.");
            setVista("listado");
            setOrdenActiva(null);
            setFirmar(false);
            await cargarPendientes(searchTerm);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo firmar el estudio");
        } finally {
            setGuardando(false);
        }
    }

    async function vistaPrevia() {
        if (!ordenActiva) return;
        exigirFirma.current = false;
        const ok = await guardarInforme();
        if (!ok) return;
        setGenerandoPdf(true);
        try {
            await abrirPdf(`/atenciones/citologia/orden/${ordenActiva.id}/pdf`);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo generar el PDF");
        } finally {
            setGenerandoPdf(false);
        }
    }

    const mostrarMotivo = form.checks.cm3 || form.checks.cm4;

    if (vista === "informe" && ordenActiva) {
        return (
            <div className="space-y-5">
                <div
                    className="flex items-center justify-between rounded-lg border px-6 py-5"
                    style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
                >
                    <div>
                        <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                            Atenciones · Citologías
                        </span>
                        <h1 style={{ color: "var(--ink-primary)" }}>Informe de Citología — Orden {ordenActiva.consecutivo || ordenActiva.id}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                            <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                Fecha de ingreso: <span className="font-medium">{ordenActiva.fechaIngreso}</span>
                            </p>
                            <Campo nombre="fechaSalida" error={v.error("fechaSalida")}>
                                <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    Fecha de salida:
                                    <Input
                                        type="date"
                                        className="h-8 w-auto"
                                        value={form.fechaSalida}
                                        onChange={(e) => setForm((f) => ({ ...f, fechaSalida: e.target.value }))}
                                    />
                                </label>
                            </Campo>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={volverAlListado}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Listado
                    </Button>
                </div>

                <div className="grid grid-cols-10 gap-4">
                    {/* Columna izquierda: 30% */}
                    <div className="col-span-10 space-y-4 lg:col-span-3">
                        <PacienteCard p={ordenActiva.paciente} />

                        <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="border-b px-4 py-3 text-[12.5px] font-medium" style={{ borderColor: "var(--border-default)" }}>
                                Estudios Anteriores
                            </p>
                            {estudiosAnteriores.length === 0 ? (
                                <p className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                                    Este paciente no tiene estudios anteriores finalizados.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Espécimen / Estudio</span></TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {estudiosAnteriores.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell className="py-2.5">
                                                    <p className="text-sm font-bold">{e.orden.consecutivo || e.orden.id}</p>
                                                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {e.orden.fechaIngreso}
                                                    </p>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {e.orden.especimen?.nombre ?? "—"}
                                                    {e.orden.tipoEstudio?.nombreTipoEstudio
                                                        ? ` - ${e.orden.tipoEstudio.nombreTipoEstudio}`
                                                        : ""}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" title="Ver informe en PDF" onClick={() => abrirPdf(`/atenciones/citologia/orden/${e.orden.id}/pdf`).catch(() => setPreviewAnterior(e))}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-[12.5px] font-bold">Antecedentes Gineco-obstétricos</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Campo label="G" labelClassName="text-[12px]" nombre="g" error={vAnt.error("g")}>
                                    <Input value={antecedentes.g} onChange={(e) => setAntecedentes((a) => ({ ...a, g: e.target.value }))} />
                                </Campo>
                                <Campo label="P" labelClassName="text-[12px]" nombre="p" error={vAnt.error("p")}>
                                    <Input value={antecedentes.p} onChange={(e) => setAntecedentes((a) => ({ ...a, p: e.target.value }))} />
                                </Campo>
                                <Campo label="A" labelClassName="text-[12px]" nombre="a" error={vAnt.error("a")}>
                                    <Input value={antecedentes.a} onChange={(e) => setAntecedentes((a) => ({ ...a, a: e.target.value }))} />
                                </Campo>
                                <Campo label="C" labelClassName="text-[12px]" nombre="c" error={vAnt.error("c")}>
                                    <Input value={antecedentes.c} onChange={(e) => setAntecedentes((a) => ({ ...a, c: e.target.value }))} />
                                </Campo>
                                <Campo label="IVSA" labelClassName="text-[12px]" nombre="ivsa" error={vAnt.error("ivsa")} className="col-span-2">
                                    <Input value={antecedentes.ivsa} onChange={(e) => setAntecedentes((a) => ({ ...a, ivsa: e.target.value }))} />
                                </Campo>
                                <Campo label="MPF" labelClassName="text-[12px]" nombre="mpf" error={vAnt.error("mpf")} className="col-span-2">
                                    <Input value={antecedentes.mpf} onChange={(e) => setAntecedentes((a) => ({ ...a, mpf: e.target.value }))} />
                                </Campo>
                                <Campo label="FUM" labelClassName="text-[12px]" nombre="fum" error={vAnt.error("fum")}>
                                    <Input value={antecedentes.fum} onChange={(e) => setAntecedentes((a) => ({ ...a, fum: e.target.value }))} />
                                </Campo>
                                <Campo label="FUC" labelClassName="text-[12px]" nombre="fuc" error={vAnt.error("fuc")}>
                                    <Input value={antecedentes.fuc} onChange={(e) => setAntecedentes((a) => ({ ...a, fuc: e.target.value }))} />
                                </Campo>
                                <Campo label="FUP" labelClassName="text-[12px]" nombre="fup" error={vAnt.error("fup")}>
                                    <Input value={antecedentes.fup} onChange={(e) => setAntecedentes((a) => ({ ...a, fup: e.target.value }))} />
                                </Campo>
                            </div>

                            <p className="mb-1.5 mt-3 text-[11px] font-bold text-muted-foreground">Cuello</p>
                            <div className="flex flex-wrap gap-3">
                                {CUELLO.map((c) => (
                                    <label key={c.key} className="flex items-center gap-1.5 text-[12px]">
                                        <input
                                            type="checkbox"
                                            checked={!!antecedentes.checks[c.key]}
                                            onChange={(e) => toggleAntecedenteCheck(c.key, e.target.checked)}
                                        />
                                        {c.label}
                                    </label>
                                ))}
                            </div>

                            <p className="mb-1.5 mt-3 text-[11px] font-bold text-muted-foreground">Flujo</p>
                            <div className="flex flex-wrap gap-3">
                                {FLUJO.map((f) => (
                                    <label key={f.key} className="flex items-center gap-1.5 text-[12px]">
                                        <input
                                            type="checkbox"
                                            checked={!!antecedentes.checks[f.key]}
                                            onChange={(e) => toggleAntecedenteCheck(f.key, e.target.checked)}
                                        />
                                        {f.label}
                                    </label>
                                ))}
                            </div>

                            <div className="mt-3 space-y-1">
                                <label className="text-[11px] font-medium">Observaciones</label>
                                <Textarea
                                    rows={2}
                                    value={antecedentes.observaciones}
                                    onChange={(e) => setAntecedentes((a) => ({ ...a, observaciones: e.target.value }))}
                                />
                            </div>

                            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={guardarAntecedentes} disabled={guardandoAntecedentes}>
                                {guardandoAntecedentes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Antecedentes
                            </Button>
                        </div>
                    </div>

                    {/* Columna derecha: 70% */}
                    <div className="col-span-10 space-y-4 lg:col-span-7">
                        <GrupoChecks
                            titulo="Calidad de la Muestra"
                            items={CALIDAD_MUESTRA}
                            checks={form.checks}
                            onToggle={toggleCheck}
                            nombre="calidad"
                            error={v.error("calidad")}
                        />
                        {mostrarMotivo && (
                            <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                <Campo label="Especifique Motivo" nombre="cm5" error={v.error("cm5")} requerido>
                                    <Input value={form.cm5} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, cm5: e.target.value }))} />
                                </Campo>
                            </div>
                        )}

                        <GrupoChecks
                            titulo="Categorización General"
                            items={CATEGORIZACION_GENERAL}
                            checks={form.checks}
                            onToggle={toggleCheck}
                            nombre="categorizacion"
                            error={v.error("categorizacion")}
                        />
                        <GrupoChecks titulo="Microorganismos" items={MICROORGANISMOS} checks={form.checks} onToggle={toggleCheck} />
                        <GrupoChecks titulo="Otros Hallazgos No Neoplásicos (cambios reactivos asociados a:)" items={OHNN} checks={form.checks} onToggle={toggleCheck} />
                        <GrupoChecks titulo="Anormalidades en Células Escamosas (ASC)" items={CELULAS_ESCAMOSAS} checks={form.checks} onToggle={toggleCheck} />

                        <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <p className="mb-3 text-[12.5px] font-bold">Anormalidades en Células Glandulares (AGC)</p>
                            <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">Células Glandulares Atípicas (AGC)</p>
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                {CELULAS_GLANDULARES_ATIPICAS.map((c) => (
                                    <label key={c.key} className="flex items-center gap-2 text-[12.5px]">
                                        <input type="checkbox" checked={!!form.checks[c.key]} onChange={(e) => toggleCheck(c.key, e.target.checked)} />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                            <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">Células Glandulares Atípicas a Favor de Neoplasia</p>
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                {CELULAS_GLANDULARES_NEOPLASIA.map((c) => (
                                    <label key={c.key} className="flex items-center gap-2 text-[12.5px]">
                                        <input type="checkbox" checked={!!form.checks[c.key]} onChange={(e) => toggleCheck(c.key, e.target.checked)} />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {CELULAS_GLANDULARES_OTROS.map((c) => (
                                    <label key={c.key} className="flex items-center gap-2 text-[12.5px]">
                                        <input type="checkbox" checked={!!form.checks[c.key]} onChange={(e) => toggleCheck(c.key, e.target.checked)} />
                                        {c.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <GrupoChecks titulo="Flora Bacilar" items={FLORA_BACILAR} checks={form.checks} onToggle={toggleCheck} />
                        <GrupoChecks titulo="Inflamación" items={INFLAMACION} checks={form.checks} onToggle={toggleCheck} />

                        <div className="rounded-lg border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                            <Campo label="Observaciones" nombre="observaciones" error={v.error("observaciones")}>
                                <Textarea rows={3} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
                            </Campo>
                            <Campo label="Diagnóstico" nombre="diagnostico" error={v.error("diagnostico")} requerido className="mt-3">
                                <Textarea rows={4} value={form.diagnostico} onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))} />
                            </Campo>

                            <div className="mt-3">
                                <ResumenErrores mensaje={v.resumen ?? vAnt.resumen} />
                            </div>
                            {formError && (
                                <p
                                    className="mt-3 rounded-md px-3 py-2 text-[12.5px]"
                                    style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <label className="mr-auto flex items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium">
                                    <input
                                        type="checkbox"
                                        checked={firmar}
                                        onChange={(e) => {
                                            setFirmar(e.target.checked);
                                            if (!e.target.checked) {
                                                exigirFirma.current = false;
                                                v.reiniciar();
                                            }
                                        }}
                                    />
                                    Firmar y cerrar el estudio
                                </label>
                                <Button variant="outline" onClick={() => setImagenesAbierto(true)}>
                                    <Camera size={14} /> Imágenes
                                </Button>
                                <Button variant="outline" onClick={vistaPrevia} disabled={generandoPdf || guardando}>
                                    {generandoPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown size={14} />}
                                    Vista previa PDF
                                </Button>
                                <Button onClick={onGuardar} disabled={guardando}>
                                    {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : firmar ? <PenLine size={14} /> : null}
                                    {firmar ? "Guardar y firmar" : "Guardar Informe"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <ImagenesDialog open={imagenesAbierto} onOpenChange={setImagenesAbierto} idOrden={ordenActiva.id} titulo={`Orden ${ordenActiva.consecutivo}`} />
                <Dialog open={confirmarFirma} onOpenChange={setConfirmarFirma}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Firmar Estudio</DialogTitle>
                            <DialogDescription>
                                ¿Desea Firmar y cerrar el Estudio? Si continúa no se podrán hacer cambios. La orden pasará a estado ATENDIDO.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setConfirmarFirma(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={firmarEstudio}>
                                <PenLine size={14} /> Firmar
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
                <Dialog open={!!previewAnterior} onOpenChange={(open) => !open && setPreviewAnterior(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Orden {previewAnterior?.orden.consecutivo || previewAnterior?.orden.id}</DialogTitle>
                            <DialogDescription>Diagnóstico del estudio anterior.</DialogDescription>
                        </DialogHeader>
                        <p className="whitespace-pre-wrap rounded-md border bg-muted/20 px-3 py-2 text-sm" style={{ borderColor: "var(--border-default)" }}>
                            {previewAnterior?.diagnostico || "(vacío)"}
                        </p>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div
                className="flex items-center justify-between rounded-lg border px-6 py-5"
                style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
            >
                <div>
                    <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>
                        Atenciones
                    </span>
                    <h1 style={{ color: "var(--ink-primary)" }}>Citologías</h1>
                    <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                        Órdenes pendientes de informe de citología
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => cargarPendientes(searchTerm)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Actualizar
                </Button>
            </div>

            {error && (
                <p
                    className="rounded-md px-4 py-2.5 text-[13px]"
                    style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                >
                    {error}
                </p>
            )}

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por orden, nombre o identificación..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>

            <div className="rounded-lg border" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead><span className="inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" />Orden</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Paciente</span></TableHead>
                            <TableHead><span className="inline-flex items-center gap-1.5"><TestTube2 className="h-3.5 w-3.5" />Espécimen / Estudio</span></TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!loading && pendientes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-8 text-center text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                    No hay órdenes pendientes de informe.
                                </TableCell>
                            </TableRow>
                        )}
                        {tablaPendientes.visibles.map((orden) => {
                            const p = orden.paciente;
                            return (
                                <TableRow key={orden.id} className="align-top hover:bg-muted/40">
                                    <TableCell className="py-3">
                                        <p className="font-bold">{orden.consecutivo || orden.id}</p>
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CalendarDays className="h-3 w-3" />
                                            {orden.fechaIngreso}
                                        </p>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <p className="font-bold">{nombrePaciente(p).toUpperCase()}</p>
                                        {p && (
                                            <p className="text-xs text-muted-foreground">
                                                {p.idTipoIdentificacion}
                                                {p.identificacion} · {p.sexo === "M" ? "M" : "F"} ·{" "}
                                                {calcularEdad(p.fechaNacimiento)} años
                                                {p.telefono ? ` · ${p.telefono}` : ""}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-sm">
                                        {orden.especimen?.nombre ?? "—"}
                                        {orden.tipoEstudio?.nombreTipoEstudio ? ` - ${orden.tipoEstudio.nombreTipoEstudio}` : ""}
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                        {orden.tieneInforme ? (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">Con informe</Badge>
                                        ) : (
                                            <Badge variant="secondary">Pendiente</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                        <Button size="sm" onClick={() => abrirOrden(orden)}>
                                            <Microscope size={14} />
                                            Informar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls {...tablaPendientes.paginacion} />
        </div>
    );
}
