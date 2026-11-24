import * as http from 'node:http';
import * as https from 'node:https';

/**
 * POST con exactamente los encabezados indicados.
 *
 * No se usa `fetch` de Node (undici) porque añade por su cuenta `accept-language: *`,
 * `sec-fetch-mode`, `user-agent`, etc., y el API Management de MinSalud (IHCE) rechaza
 * cualquier encabezado no declarado: "Unspecified header Accept-Language is not allowed".
 */
export function postExacto(
  url: string,
  encabezados: Record<string, string>,
  cuerpo: string,
  timeoutMs = 90000,
): Promise<{ ok: boolean; status: number; cuerpo: string }> {
  const u = new URL(url);
  const cliente = u.protocol === 'http:' ? http : https;
  const datos = Buffer.from(cuerpo, 'utf8');
  return new Promise((resolve, reject) => {
    const req = cliente.request(
      u,
      {
        method: 'POST',
        // Solo lo mismo que manda el escritorio (HttpClient de .NET): Authorization, la llave de
        // suscripción y Content-Type; Host y Content-Length los pone Node.
        headers: { ...encabezados, 'Content-Length': String(datos.length) },
        timeout: timeoutMs,
      },
      (res) => {
        const trozos: Buffer[] = [];
        res.on('data', (t: Buffer) => trozos.push(t));
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          resolve({ ok: status >= 200 && status < 300, status, cuerpo: Buffer.concat(trozos).toString('utf8') });
        });
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Tiempo de espera agotado (${timeoutMs / 1000} s) llamando a ${u.host}`)));
    req.on('error', reject);
    req.end(datos);
  });
}
