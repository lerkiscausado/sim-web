import { DataSource } from 'typeorm';

/** Fila de config_interop_api ya resuelta (las variables de entorno tienen prioridad sobre la BD). */
export interface ConfigRda {
  id: number;
  ambiente: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
  urlAuthServer: string;
  urlBaseApi: string;
  codigoPrestadorReps: string;
  nitPrestador: string;
  estado: boolean;
  /** De dónde salió cada secreto, para mostrarlo en pantalla sin revelarlo. */
  origen: { clientSecret: 'entorno' | 'bd' | 'vacio'; subscriptionKey: 'entorno' | 'bd' | 'vacio' };
}

/**
 * Scope de Azure AD de la API de MinSalud. El escritorio lo tenía fijo en el código
 * (InteropAuthService.vb); aquí se puede cambiar con RDA_SCOPE cuando MinSalud entregue
 * el de producción.
 */
export const RDA_SCOPE_POR_DEFECTO = 'api://ca9a5155-3135-4e44-a644-b92175eb4d21/.default';
export const rdaScope = () => process.env.RDA_SCOPE?.trim() || RDA_SCOPE_POR_DEFECTO;

const env = (n: string) => process.env[n]?.trim() || '';

/**
 * Configuración activa. El escritorio tomaba "la primera fila" sin mirar estado ni
 * ambiente (riesgo §8.2); aquí: la activa (estado = 1), prefiriendo SANDBOX y la más reciente.
 */
export async function cargarConfigRda(ds: DataSource): Promise<ConfigRda | null> {
  const [c] = await ds.query(
    `SELECT * FROM config_interop_api
     ORDER BY (estado = 1) DESC, (UPPER(ambiente) = 'SANDBOX') DESC, id DESC LIMIT 1`,
  );
  if (!c) return null;
  const secretoBd = (c.client_secret ?? '').trim();
  const llaveBd = (c.subscription_key ?? '').trim();
  return {
    id: c.id,
    ambiente: (c.ambiente ?? 'SANDBOX').trim().toUpperCase(),
    tenantId: env('RDA_TENANT_ID') || (c.tenant_id ?? '').trim(),
    clientId: env('RDA_CLIENT_ID') || (c.client_id ?? '').trim(),
    clientSecret: env('RDA_CLIENT_SECRET') || secretoBd,
    subscriptionKey: env('RDA_SUBSCRIPTION_KEY') || llaveBd,
    urlAuthServer: (c.url_auth_server ?? '').trim(),
    urlBaseApi: (c.url_base_api ?? '').trim().replace(/\/+$/, ''),
    codigoPrestadorReps: (c.codigo_prestador_reps ?? '').trim(),
    nitPrestador: (c.nit_prestador ?? '').trim(),
    estado: Number(c.estado) === 1,
    origen: {
      clientSecret: env('RDA_CLIENT_SECRET') ? 'entorno' : secretoBd ? 'bd' : 'vacio',
      subscriptionKey: env('RDA_SUBSCRIPTION_KEY') ? 'entorno' : llaveBd ? 'bd' : 'vacio',
    },
  };
}

/**
 * Regla del proyecto: el RDA se prueba solo contra el sandbox de MinSalud. Un envío a
 * cualquier otro ambiente/URL exige RDA_PERMITIR_PRODUCCION=true en el .env del backend.
 */
export function motivoBloqueoAmbiente(c: ConfigRda): string | null {
  if (process.env.RDA_PERMITIR_PRODUCCION === 'true') return null;
  const esSandbox = c.ambiente === 'SANDBOX' && /sandbox/i.test(c.urlBaseApi);
  return esSandbox
    ? null
    : `Envío bloqueado: el ambiente configurado es ${c.ambiente} (${c.urlBaseApi || 'sin URL'}). La web solo envía al sandbox de MinSalud mientras RDA_PERMITIR_PRODUCCION no sea "true" en el .env del backend.`;
}
