"use client";

import { useEffect, useState } from "react";
import { Loader2, PlugZap, Save, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Campo } from "@/components/ui/campo";
import { Pildora } from "@/components/ui/panel";
import { useFeedback } from "@/components/ui/feedback";

interface ConfigRda {
    id: number;
    ambiente: "SANDBOX" | "PRODUCCION";
    tenantId: string;
    clientId: string;
    urlAuthServer: string;
    urlBaseApi: string;
    codigoPrestadorReps: string;
    nitPrestador: string;
    estado: boolean;
    clientSecret: "entorno" | "bd" | "vacio";
    subscriptionKey: "entorno" | "bd" | "vacio";
    tokenVence: string | null;
    bloqueo: string | null;
    prestador: string | null;
    repsServicio: { codigo: string; texto: string };
}

const ORIGEN: Record<ConfigRda["clientSecret"], string> = {
    entorno: "Definido en el .env del backend (tiene prioridad)",
    bd: "Guardado. Escriba uno nuevo solo para cambiarlo",
    vacio: "Sin configurar",
};

const VACIO = {
    ambiente: "SANDBOX",
    tenantId: "",
    clientId: "",
    clientSecret: "",
    subscriptionKey: "",
    urlAuthServer: "https://login.microsoftonline.com/{{tenantid}}/oauth2/v2.0/token",
    urlBaseApi: "https://sandbox.ihcecol.gov.co/ihce",
    codigoPrestadorReps: "",
    nitPrestador: "",
    estado: true,
};

/** Configuración → Interoperabilidad (frmRDA del escritorio). Los secretos nunca se muestran. */
export default function InteroperabilidadPage() {
    const { avisar } = useFeedback();
    const [config, setConfig] = useState<ConfigRda | null>(null);
    const [form, setForm] = useState(VACIO);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [probando, setProbando] = useState(false);
    const [prueba, setPrueba] = useState<{ ok: boolean; mensaje: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    function aplicar(c: ConfigRda | null) {
        setConfig(c);
        if (c) {
            setForm({
                ambiente: c.ambiente,
                tenantId: c.tenantId,
                clientId: c.clientId,
                clientSecret: "",
                subscriptionKey: "",
                urlAuthServer: c.urlAuthServer,
                urlBaseApi: c.urlBaseApi,
                codigoPrestadorReps: c.codigoPrestadorReps,
                nitPrestador: c.nitPrestador,
                estado: c.estado,
            });
        }
    }

    useEffect(() => {
        api.get<ConfigRda | null>("/interoperabilidad/rda/config")
            .then(aplicar)
            .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudo cargar la configuración"))
            .finally(() => setCargando(false));
    }, []);

    async function guardar() {
        setGuardando(true);
        setError(null);
        try {
            const cuerpo: Record<string, unknown> = { ...form };
            if (!form.clientSecret.trim()) delete cuerpo.clientSecret;
            if (!form.subscriptionKey.trim()) delete cuerpo.subscriptionKey;
            if (!form.codigoPrestadorReps.trim()) delete cuerpo.codigoPrestadorReps;
            if (!form.nitPrestador.trim()) delete cuerpo.nitPrestador;
            aplicar(await api.put<ConfigRda>("/interoperabilidad/rda/config", cuerpo));
            avisar.exito("Configuración RDA guardada.");
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "No se pudo guardar");
        } finally {
            setGuardando(false);
        }
    }

    async function probar() {
        setProbando(true);
        setPrueba(null);
        try {
            setPrueba(await api.post<{ ok: boolean; mensaje: string }>("/interoperabilidad/rda/probar-conexion"));
        } catch (err) {
            setPrueba({ ok: false, mensaje: err instanceof ApiError ? err.message : "No se pudo probar la conexión" });
        } finally {
            setProbando(false);
        }
    }

    const set = (k: keyof typeof VACIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div className="space-y-5">
            <div className="encabezado-modulo">
                <span className="label-clinical mb-2 inline-block" style={{ color: "var(--ink-brand)" }}>Configuración</span>
                <h1 style={{ color: "var(--ink-primary)" }}>Interoperabilidad RDA</h1>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-secondary)" }}>
                    Conexión con MinSalud para el Resumen Digital de Atención (Resolución 1888 de 2025). Se envía al firmar historias y estudios.
                </p>
            </div>

            {cargando && <Loader2 className="h-5 w-5 animate-spin" />}
            {error && <p className="rounded-md px-4 py-2.5 text-[13px]" style={{ background: "var(--status-danger-bg, #fef2f2)", color: "var(--status-danger, #dc2626)" }}>{error}</p>}

            {config?.bloqueo && (
                <p className="flex items-start gap-2 rounded-md px-4 py-2.5 text-[13px]" style={{ background: "#FFF7ED", color: "#9A3412" }}>
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    {config.bloqueo}
                </p>
            )}

            {!cargando && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 rounded-lg border p-5 lg:col-span-2" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                        <p className="text-sm font-bold">Prestador</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Campo label="Código de habilitación (REPS)" nombre="codigoPrestadorReps" requerido>
                                <Input inputMode="numeric" maxLength={10} value={form.codigoPrestadorReps} onChange={set("codigoPrestadorReps")} placeholder="10 dígitos" />
                            </Campo>
                            <Campo label="NIT (sin dígito de verificación)" nombre="nitPrestador">
                                <Input inputMode="numeric" value={form.nitPrestador} onChange={set("nitPrestador")} />
                            </Campo>
                        </div>
                        <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                            Nombre que se envía: <b>{config?.prestador ?? "—"}</b> (empresa con este REPS). Servicio REPS: {config?.repsServicio.codigo} {config?.repsServicio.texto}.
                        </p>

                        <p className="border-t pt-4 text-sm font-bold" style={{ borderColor: "var(--border-default)" }}>Conexión</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Campo label="Ambiente" nombre="ambiente">
                                <Select className="w-full" value={form.ambiente} onChange={set("ambiente")}>
                                    <option value="SANDBOX">Pruebas (sandbox)</option>
                                    <option value="PRODUCCION">Producción</option>
                                </Select>
                            </Campo>
                            <Campo label="Estado" nombre="estado">
                                <Select className="w-full" value={form.estado ? "1" : "0"} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value === "1" }))}>
                                    <option value="1">Activa</option>
                                    <option value="0">Inactiva</option>
                                </Select>
                            </Campo>
                            <Campo label="URL de la API" nombre="urlBaseApi" className="col-span-2">
                                <Input value={form.urlBaseApi} onChange={set("urlBaseApi")} />
                            </Campo>
                            <Campo label="Servidor de token (Azure AD)" nombre="urlAuthServer" className="col-span-2">
                                <Input value={form.urlAuthServer} onChange={set("urlAuthServer")} />
                            </Campo>
                            <Campo label="Tenant ID" nombre="tenantId">
                                <Input value={form.tenantId} onChange={set("tenantId")} />
                            </Campo>
                            <Campo label="Client ID" nombre="clientId">
                                <Input value={form.clientId} onChange={set("clientId")} />
                            </Campo>
                            <Campo label="Client secret" nombre="clientSecret">
                                <Input type="password" autoComplete="new-password" value={form.clientSecret} onChange={set("clientSecret")} placeholder={config ? ORIGEN[config.clientSecret] : "Sin configurar"} />
                            </Campo>
                            <Campo label="Subscription key (APIM)" nombre="subscriptionKey">
                                <Input type="password" autoComplete="new-password" value={form.subscriptionKey} onChange={set("subscriptionKey")} placeholder={config ? ORIGEN[config.subscriptionKey] : "Sin configurar"} />
                            </Campo>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={guardar} disabled={guardando}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar
                            </Button>
                            <Button variant="outline" onClick={probar} disabled={probando || !config}>
                                {probando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
                                Probar conexión
                            </Button>
                        </div>
                        {prueba && (
                            <p className="flex items-start gap-2 text-[13px]" style={{ color: prueba.ok ? "var(--status-success, #16a34a)" : "var(--status-danger, #dc2626)" }}>
                                {prueba.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                                {prueba.mensaje}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3 rounded-lg border p-5 text-[12.5px]" style={{ background: "var(--surface-raised)", borderColor: "var(--border-default)" }}>
                        <p className="text-sm font-bold">Estado</p>
                        <p>Ambiente: <Pildora tono={config?.ambiente === "SANDBOX" ? "info" : "aviso"}>{config?.ambiente ?? "—"}</Pildora></p>
                        <p>Token vigente hasta: <b>{config?.tokenVence ? new Date(config.tokenVence).toLocaleString("es-CO") : "—"}</b></p>
                        <p style={{ color: "var(--ink-secondary)" }}>
                            &quot;Probar conexión&quot; solo pide un token a MinSalud; no envía datos de pacientes.
                        </p>
                        <p style={{ color: "var(--ink-secondary)" }}>
                            Por seguridad, la web solo envía al sandbox. Para producción se necesita <code>RDA_PERMITIR_PRODUCCION=true</code> en el .env del backend.
                        </p>
                        <p style={{ color: "var(--ink-secondary)" }}>
                            Las credenciales también se pueden poner en el .env (<code>RDA_CLIENT_SECRET</code>, <code>RDA_SUBSCRIPTION_KEY</code>…); así no quedan en la base de datos.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
