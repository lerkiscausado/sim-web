import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigRda, rdaScope } from './rda-config';

/** Margen para no usar un token a punto de vencer (el escritorio no tenía margen, §8.2). */
const MARGEN_SEGUNDOS = 120;

/**
 * Token OAuth2 (Azure AD, client_credentials) con caché en interop_token_cache.
 * Port de DRDA.TraerToken + InteropAuthService.SolicitarTokenAsync.
 */
@Injectable()
export class RdaTokenService {
  private readonly log = new Logger(RdaTokenService.name);

  constructor(private readonly ds: DataSource) {}

  async obtener(config: ConfigRda, forzarNuevo = false): Promise<{ token: string; expira: Date; nuevo: boolean }> {
    if (!forzarNuevo) {
      const [c] = await this.ds.query(
        `SELECT access_token AS token, fecha_expiracion AS expira FROM interop_token_cache
         WHERE config_id = ? AND fecha_expiracion > DATE_ADD(NOW(), INTERVAL ? SECOND)
         ORDER BY fecha_captura DESC LIMIT 1`,
        [config.id, MARGEN_SEGUNDOS],
      );
      if (c?.token) return { token: c.token, expira: new Date(c.expira), nuevo: false };
    }

    if (!config.clientId || !config.clientSecret || !config.urlAuthServer) {
      throw new Error('Faltan credenciales de MinSalud (client_id, client_secret o URL del servidor de token).');
    }
    const url = config.urlAuthServer.replace('{{tenantid}}', config.tenantId);
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: rdaScope(),
      }),
      signal: AbortSignal.timeout(30000),
    });
    const texto = await resp.text();
    if (!resp.ok) {
      // No se registra el cuerpo completo: podría traer datos del tenant.
      throw new Error(`Error de autenticación con MinSalud: HTTP ${resp.status} ${texto.slice(0, 300)}`);
    }
    const json = JSON.parse(texto) as { access_token: string; token_type?: string; expires_in?: number | string };
    const expiresIn = Number(json.expires_in) || 3600;

    const actualizadas = await this.ds.query(
      `UPDATE interop_token_cache SET access_token = ?, token_type = ?, expires_in = ?,
              fecha_expiracion = DATE_ADD(NOW(), INTERVAL ? SECOND), fecha_captura = NOW()
       WHERE config_id = ?`,
      [json.access_token, json.token_type ?? 'Bearer', expiresIn, expiresIn, config.id],
    );
    if (!actualizadas?.affectedRows) {
      await this.ds.query(
        `INSERT INTO interop_token_cache (config_id, access_token, token_type, expires_in, fecha_expiracion, fecha_captura)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW())`,
        [config.id, json.access_token, json.token_type ?? 'Bearer', expiresIn, expiresIn],
      );
    }
    this.log.log(`Token de MinSalud renovado (vence en ${expiresIn} s).`);
    return { token: json.access_token, expira: new Date(Date.now() + expiresIn * 1000), nuevo: true };
  }
}
