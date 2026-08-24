"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Microscope, RefreshCw, Eye, Hash, User, TestTube2, CalendarDays, ArrowLeft, Search } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PacienteAvatar } from "@/components/ui/paciente-avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import type {
    OrdenPendiente,
    InformeCitologia,
    AntecedentesTomaMuestra,
    EstudioAnterior,
} from "./types";
import { nombrePaciente, calcularEdad } from "./types";

// Etiquetas clínicas reales, extraídas de frmCitologiaGeneral.Designer.vb (Properties.Caption)
const CALIDAD_MUESTRA = [
    { key: "cm1", label: "Satisfactoria Zona de Transformación Presente" },
    { key: "cm2", label: "Satisfactoria Zona de Transformación Ausente" },
    { key: "cm3", label: "Insatisfactoria" },
    { key: "cm4", label: "Rechazada" },
];
const CATEGORIZACION_GENERAL = [
    { key: "cg1", label: "Negativa para Lesión Intraepitelial o Malignidad" },
    { key: "cg2", label: "Anormalidad de Células Epiteliales" },
];
const MICROORGANISMOS = [
    { key: "m1", label: "Bacterias con Morfologías compatibles con Actynomices" },
    { key: "m2", label: "Cambios Celulares Compatibles al Herpes Virus Simple" },
    { key: "m3", label: "Trichomonas Vaginalis" },
    { key: "m4", label: "Candidiasis Vaginalis" },
    { key: "m5", label: "Vaginosis Bacteriana" },
    { key: "m6", label: "Otros Cambios" },
];
const OHNN = [
    { key: "ohnn1", label: "Inflamación" },
    { key: "ohnn2", label: "Radiación" },
    { key: "ohnn3", label: "Cambios por DIU" },
    { key: "ohnn4", label: "Células Endometriales Después de los 40 años" },
    { key: "ohnn5", label: "Células Glandulares Posthisterectomía" },
    { key: "ohnn6", label: "Atrofia" },
];
const CELULAS_ESCAMOSAS = [
    { key: "ace1", label: "De Significado Indeterminado (ASC-US)" },
    { key: "ace2", label: "No se Descarta Lesión Intraepitelial Escamosa de Alto Grado (ASC-H)" },
    { key: "ace3", label: "Lesión Intraepitelial Escamosa de Bajo Grado LIE BG (Comprende Infección por el VPH y NIC I)" },
    { key: "ace4", label: "Lesión Intraepitelial Escamosa de Alto Grado LIE AG (Comprende NIC II Y NIC III y Carcinoma in Situ)" },
    { key: "ace5", label: "Carcinoma Escamocelular" },
];
const CELULAS_GLANDULARES_ATIPICAS = [
    { key: "acg1", label: "Endocervicales" },
    { key: "acg2", label: "Endometriales" },
];
const CELULAS_GLANDULARES_NEOPLASIA = [
    { key: "acg3", label: "Endocervicales" },
    { key: "acg4", label: "Endometriales" },
];
const CELULAS_GLANDULARES_OTROS = [
    { key: "acg5", label: "Adenocarcinoma IN SITU" },
    { key: "acg8", label: "Otros" },
];
const FLORA_BACILAR = [
    { key: "fb1", label: "Escasa" },
    { key: "fb2", label: "Moderada" },
    { key: "fb3", label: "Aumentada" },
];
const INFLAMACION = [
    { key: "i1", label: "Leve" },
    { key: "i2", label: "Moderada" },
    { key: "i3", label: "Severa" },
];
const TODOS_LOS_CHECKS = [
    ...CALIDAD_MUESTRA,
    ...CATEGORIZACION_GENERAL,
    ...MICROORGANISMOS,
    ...OHNN,
    ...CELULAS_ESCAMOSAS,
    ...CELULAS_GLANDULARES_ATIPICAS,
    ...CELULAS_GLANDULARES_NEOPLASIA,
    ...CELULAS_GLANDULARES_OTROS,
    ...FLORA_BACILAR,
    ...INFLAMACION,
].map((c) => c.key);

const CUELLO = [
    { key: "s", label: "Sano" },
    { key: "u", label: "Ulcerado" },
    { key: "l", label: "Lacerado" },
];
const FLUJO = [
    { key: "bn", label: "Blanco" },
    { key: "cn", label: "Claro" },
    { key: "ba", label: "Amarillo" },
    { key: "o", label: "Con Olor" },
];

type ChecksState = Record<string, boolean>;

const FORM_INICIAL = {
    checks: Object.fromEntries(TODOS_LOS_CHECKS.map((k) => [k, false])) as ChecksState,
    cm5: "",
    observaciones: "",
    diagnostico: "",
    fechaSalida: new Date().toISOString().slice(0, 10),
};

const ANTECEDENTES_INICIAL = {
    g: "",
    p: "",
    a: "",
    c: "",
    ivsa: "",
    mpf: "",
    fum: "",
    fuc: "",
    fup: "",
    checks: { s: false, u: false, l: false, bn: false, cn: false, ba: false, o: false } as ChecksState,
    observaciones: "",
};

/** Misma tarjeta de paciente (foto + datos) usada en Pacientes, Órdenes y Patologías. */
function PacienteCard({ p }: { p: OrdenPendiente["paciente"] }) {
    if (!p) return null;
    return (
        <div
            className="flex items-stretch gap-3 rounded-lg border p-4"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}
        >
            <PacienteAvatar idPaciente={p.id} />
            <div className="min-w-0 flex-1">
                <p className="font-bold" style={{ color: "var(--ink-primary)" }}>
                    {nombrePaciente(p).toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {p.idTipoIdentificacion}
                    {p.identificacion}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Edad: {calcularEdad(p.fechaNacimiento)} años · Sexo: {p.sexo === "M" ? "Masculino" : "Femenino"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Teléfono: {p.telefono || "—"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">Correo: {p.correoElectronico || "—"}</p>
            </div>
        </div>
    );
}

function GrupoChecks({
    titulo,
    items,
    checks,
    onToggle,
}: {
    titulo: string;
    items: { key: string; label: string }[];
    checks: ChecksState;
    onToggle: (key: string, value: boolean) => void;
}) {
    return (
        <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
            <p className="mb-3 text-[12.5px] font-bold" style={{ color: "var(--ink-primary)" }}>
                {titulo}
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {items.map((item) => (
                    <label key={item.key} className="flex items-start gap-2 text-[12.5px]">
                        <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={!!checks[item.key]}
                            onChange={(e) => onToggle(item.key, e.target.checked)}
                        />
                        <span>{item.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

type Vista = "listado" | "informe";

export default function CitologiasPage() {
    const [vista, setVista] = useState<Vista>("listado");
    const [pendientes, setPendientes] = useState<OrdenPendiente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [ordenActiva, setOrdenActiva] = useState<OrdenPendiente | null>(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [antecedentes, setAntecedentes] = useState(ANTECEDENTES_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [guardandoAntecedentes, setGuardandoAntecedentes] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [estudiosAnteriores, setEstudiosAnteriores] = useState<EstudioAnterior[]>([]);
    const [previewAnterior, setPreviewAnterior] = useState<EstudioAnterior | null>(null);
    const [guardadoOk, setGuardadoOk] = useState(false);

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
        setGuardadoOk(false);
        setForm(FORM_INICIAL);
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
                    fechaSalida: new Date().toISOString().slice(0, 10),
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
        if (!ordenActiva) return;
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

    async function guardarInforme() {
        if (!ordenActiva) return;
        setFormError(null);
        setGuardadoOk(false);

        if (!form.diagnostico) {
            setFormError("El diagnóstico es obligatorio.");
            return;
        }

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
            setGuardadoOk(true);
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "No se pudo guardar el informe");
        } finally {
            setGuardando(false);
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
                        <h1 style={{ color: "var(--ink-primary)" }}>Informe de Citología — Orden {ordenActiva.consecutivo}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                            <p className="text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                Fecha de ingreso: <span className="font-medium">{ordenActiva.fechaIngreso}</span>
                            </p>
                            <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                                Fecha de salida:
                                <Input
                                    type="date"
                                    className="h-8 w-auto"
                                    value={form.fechaSalida}
                                    onChange={(e) => setForm((f) => ({ ...f, fechaSalida: e.target.value }))}
                                />
                            </label>
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
                                                    <p className="text-sm font-bold">{e.orden.consecutivo}</p>
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
                                                    <Button variant="ghost" size="sm" title="Vista previa" onClick={() => setPreviewAnterior(e)}>
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
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">G</label>
                                    <Input value={antecedentes.g} onChange={(e) => setAntecedentes((a) => ({ ...a, g: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">P</label>
                                    <Input value={antecedentes.p} onChange={(e) => setAntecedentes((a) => ({ ...a, p: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">A</label>
                                    <Input value={antecedentes.a} onChange={(e) => setAntecedentes((a) => ({ ...a, a: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">C</label>
                                    <Input value={antecedentes.c} onChange={(e) => setAntecedentes((a) => ({ ...a, c: e.target.value }))} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[11px] font-medium">IVSA</label>
                                    <Input value={antecedentes.ivsa} onChange={(e) => setAntecedentes((a) => ({ ...a, ivsa: e.target.value }))} />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[11px] font-medium">MPF</label>
                                    <Input value={antecedentes.mpf} onChange={(e) => setAntecedentes((a) => ({ ...a, mpf: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">FUM</label>
                                    <Input value={antecedentes.fum} onChange={(e) => setAntecedentes((a) => ({ ...a, fum: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">FUC</label>
                                    <Input value={antecedentes.fuc} onChange={(e) => setAntecedentes((a) => ({ ...a, fuc: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-medium">FUP</label>
                                    <Input value={antecedentes.fup} onChange={(e) => setAntecedentes((a) => ({ ...a, fup: e.target.value }))} />
                                </div>
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
                        <GrupoChecks titulo="Calidad de la Muestra" items={CALIDAD_MUESTRA} checks={form.checks} onToggle={toggleCheck} />
                        {mostrarMotivo && (
                            <div className="rounded-lg border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                                <label className="text-[12.5px] font-medium">Especifique Motivo</label>
                                <Input className="mt-1.5" value={form.cm5} onChange={(e) => setForm((f) => ({ ...f, cm5: e.target.value }))} />
                            </div>
                        )}

                        <GrupoChecks titulo="Categorización General" items={CATEGORIZACION_GENERAL} checks={form.checks} onToggle={toggleCheck} />
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
                            <div className="space-y-1.5">
                                <label className="text-[12.5px] font-medium">Observaciones</label>
                                <Textarea rows={3} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
                            </div>
                            <div className="mt-3 space-y-1.5">
                                <label className="text-[12.5px] font-medium">Diagnóstico</label>
                                <Textarea rows={4} value={form.diagnostico} onChange={(e) => setForm((f) => ({ ...f, diagnostico: e.target.value }))} />
                            </div>

                            {formError && (
                                <p
                                    className="mt-3 rounded-md px-3 py-2 text-[12.5px]"
                                    style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}
                                >
                                    {formError}
                                </p>
                            )}
                            {guardadoOk && (
                                <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-[12.5px] text-green-700">
                                    Informe guardado correctamente.
                                </p>
                            )}

                            <Button className="mt-4" onClick={guardarInforme} disabled={guardando}>
                                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Informe
                            </Button>
                        </div>
                    </div>
                </div>

                <Dialog open={!!previewAnterior} onOpenChange={(open) => !open && setPreviewAnterior(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Orden {previewAnterior?.orden.consecutivo}</DialogTitle>
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
                        {pendientes.map((orden) => {
                            const p = orden.paciente;
                            return (
                                <TableRow key={orden.id} className="align-top hover:bg-muted/40">
                                    <TableCell className="py-3">
                                        <p className="font-bold">{orden.consecutivo}</p>
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
        </div>
    );
}
