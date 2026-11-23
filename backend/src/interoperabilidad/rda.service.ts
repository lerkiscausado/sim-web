import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InformesClinicosPdfService } from '../informes-clinicos/informes-clinicos-pdf.service';
import { empresaPrestador } from '../informes-clinicos/empresa-prestador';
import { PDFDocument, pdfABuffer } from '../reportes/pdf-utils';
import { EspecialistaRda, Json, PacienteRda, PrestadorRda, vacio } from './rda-comun';
import { ConfigRda, cargarConfigRda, motivoBloqueoAmbiente } from './rda-config';
import { RdaTokenService } from './rda-token.service';
import { construirBundlePaciente } from './rda-paciente.builder';
import { construirBundleConsultaExterna, displayOficialCie10 } from './rda-consulta.builder';
import { explicarResultado, nombreDocumento } from './rda-explicacion';
import { ActualizarConfigRdaDto } from './dto/actualizar-config-rda.dto';

export type TipoDocumentoRda = 'RDA-PACIENTE' | 'RDA-PACIENTE-MPI' | 'RDA-CONSULTA-EXTERNA';

export interface ResultadoEnvio {
  exitoso: boolean;
  codigoHttp: number | null;
  mensaje: string;
}

/**
 * Servicio habilitado REPS que va en Encounter.type. El escritorio lo tenía fijo (316
 * GASTROENTEROLOGIA) y está pendiente confirmarlo con GASTROLAP (§8.1 punto 2): se puede
 * cambiar con RDA_REPS_SERVICIO_CODIGO / RDA_REPS_SERVICIO_TEXTO.
 */
const repsServicio = () => ({
  codigo: process.env.RDA_REPS_SERVICIO_CODIGO?.trim() || '316',
  texto: process.env.RDA_REPS_SERVICIO_TEXTO?.trim() || 'GASTROENTEROLOGIA',
});

/** CUPS de consulta que va en Encounter.serviceType cuando el encuentro es un procedimiento (error 6007). */
const CUPS_CONSULTA_ESPECIALISTA = { codigo: '890246', texto: 'CONSULTA DE PRIMERA VEZ POR ESPECIALISTA EN GASTROENTEROLOGÍA' };

/** Solo se listan como "firmados sin RDA" los de los últimos días (los viejos del escritorio no aplican). */
const DIAS_PENDIENTES = 60;

/**
 * Interoperabilidad RDA con MinSalud: RDA-Paciente y RDA-Consulta Externa.
 * Port de DRDAPaciente.vb y DRDAConsultaExterna.vb. Diferencias deliberadas:
 * - Guarda el Bundle enviado (sin el PDF) y el detalle de la orden (migración 008).
 * - Hora real de la atención en Encounter.period; etnia/discapacidad del paciente en RDA-CE.
 * - PDF real de la historia o del estudio en el DocumentReference.
 * - Nunca envía fuera del sandbox sin RDA_PERMITIR_PRODUCCION=true.
 */
@Injectable()
export class RdaService {
  private readonly log = new Logger(RdaService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly tokens: RdaTokenService,
    private readonly pdf: InformesClinicosPdfService,
  ) {}

  // ───────────────────────────── Configuración ─────────────────────────────

  async configPublica() {
    const c = await cargarConfigRda(this.ds);
    if (!c) return null;
    const [cache] = await this.ds.query(
      'SELECT fecha_expiracion AS expira, fecha_captura AS captura FROM interop_token_cache WHERE config_id = ? ORDER BY fecha_captura DESC LIMIT 1',
      [c.id],
    );
    return {
      id: c.id,
      ambiente: c.ambiente,
      tenantId: c.tenantId,
      clientId: c.clientId,
      urlAuthServer: c.urlAuthServer,
      urlBaseApi: c.urlBaseApi,
      codigoPrestadorReps: c.codigoPrestadorReps,
      nitPrestador: c.nitPrestador,
      estado: c.estado,
      // Los secretos nunca salen del backend: solo si existen y de dónde vienen.
      clientSecret: c.origen.clientSecret,
      subscriptionKey: c.origen.subscriptionKey,
      tokenVence: cache?.expira ?? null,
      bloqueo: motivoBloqueoAmbiente(c),
      prestador: (await empresaPrestador(this.ds))?.nombre ?? null,
      repsServicio: repsServicio(),
    };
  }

  async actualizarConfig(dto: ActualizarConfigRdaDto) {
    const actual = await cargarConfigRda(this.ds);
    const campos: [string, unknown][] = [
      ['ambiente', dto.ambiente],
      ['tenant_id', dto.tenantId],
      ['client_id', dto.clientId],
      ['url_auth_server', dto.urlAuthServer],
      ['url_base_api', dto.urlBaseApi],
      ['codigo_prestador_reps', dto.codigoPrestadorReps],
      ['nit_prestador', dto.nitPrestador],
      ['estado', dto.estado === undefined ? undefined : dto.estado ? 1 : 0],
      // Secretos: solo si se escribió uno nuevo (vacío = dejar el que está).
      ['client_secret', dto.clientSecret?.trim() || undefined],
      ['subscription_key', dto.subscriptionKey?.trim() || undefined],
    ];
    const set = campos.filter(([, v]) => v !== undefined);
    if (actual) {
      if (set.length) {
        await this.ds.query(
          `UPDATE config_interop_api SET ${set.map(([k]) => `${k} = ?`).join(', ')}, fecha_actualizacion = NOW() WHERE id = ?`,
          [...set.map(([, v]) => (typeof v === 'string' ? v.trim() : v)), actual.id],
        );
      }
    } else {
      await this.ds.query(
        `INSERT INTO config_interop_api (${set.map(([k]) => k).join(', ')}, fecha_registro) VALUES (${set.map(() => '?').join(', ')}, NOW())`,
        set.map(([, v]) => v),
      );
    }
    // El REPS también vive en empresa.codigo_prestador (lo usa el encabezado de informes).
    if (dto.codigoPrestadorReps?.trim()) {
      const emp = await empresaPrestador(this.ds);
      if (emp) await this.ds.query('UPDATE empresa SET codigo_prestador = ? WHERE ID = ?', [dto.codigoPrestadorReps.trim(), emp.id]);
    }
    // Credenciales nuevas: el token en caché ya no sirve.
    if (dto.clientSecret?.trim() || dto.clientId || dto.tenantId) {
      await this.ds.query('DELETE FROM interop_token_cache WHERE config_id = ?', [actual?.id ?? 0]).catch(() => undefined);
    }
    return this.configPublica();
  }

  /** "Probar conexión": pide un token nuevo a Azure AD. No envía nada a MinSalud. */
  async probarConexion() {
    const c = await cargarConfigRda(this.ds);
    if (!c) throw new BadRequestException('No hay configuración de interoperabilidad RDA.');
    try {
      const t = await this.tokens.obtener(c, true);
      return { ok: true, mensaje: `Conexión correcta: MinSalud entregó un token que vence ${t.expira.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}.` };
    } catch (e) {
      return { ok: false, mensaje: (e as Error).message };
    }
  }

  // ───────────────────────────── Registro ─────────────────────────────

  private async registrar(
    idOrden: number,
    tipo: TipoDocumentoRda,
    exitoso: boolean,
    detalle: string,
    codigoHttp: number | null = null,
    extra: { idDetalleOrden?: number | null; bundle?: Json | null } = {},
  ) {
    const compositionId = exitoso ? extraerCompositionId(detalle) : null;
    try {
      await this.ds.query(
        `INSERT INTO rda_envios (id_orden, tipo_documento, exitoso, codigo_http, detalle, fecha_envio, composition_id, id_detalle_orden, bundle)
         VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
        [
          idOrden,
          tipo,
          exitoso ? 1 : 0,
          codigoHttp,
          (detalle ?? '').slice(0, 60000),
          compositionId,
          extra.idDetalleOrden ?? null,
          extra.bundle ? JSON.stringify(sinPdf(extra.bundle)) : null,
        ],
      );
    } catch (e) {
      // Sin la migración 008: se registra sin las columnas nuevas.
      this.log.warn(`rda_envios sin columnas de la 008 (${(e as Error).message}); se registra sin bundle.`);
      await this.ds
        .query(
          `INSERT INTO rda_envios (id_orden, tipo_documento, exitoso, codigo_http, detalle, fecha_envio, composition_id)
           VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
          [idOrden, tipo, exitoso ? 1 : 0, codigoHttp, (detalle ?? '').slice(0, 60000), compositionId],
        )
        .catch((e2) => this.log.error(`No se pudo registrar el envío RDA: ${(e2 as Error).message}`));
    }
  }

  private async post(c: ConfigRda, ruta: string, cuerpo: Json, token: string) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (c.subscriptionKey) headers['Ocp-Apim-Subscription-Key'] = c.subscriptionKey;
    const resp = await fetch(`${c.urlBaseApi}${ruta}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(90000),
    });
    return { ok: resp.ok, status: resp.status, cuerpo: await resp.text() };
  }

  // ───────────────────────────── Datos ─────────────────────────────

  private async paciente(idUsuario: number): Promise<PacienteRda | null> {
    const [u] = await this.ds.query(
      `SELECT ID_TIPO_IDENTIFICACION AS idTipoIdentificacion, TRIM(IDENTIFICACION) AS identificacion,
              TRIM(PRIMER_NOMBRE) AS primerNombre, TRIM(SEGUNDO_NOMBRE) AS segundoNombre,
              TRIM(PRIMER_APELLIDO) AS primerApellido, TRIM(SEGUNDO_APELLIDO) AS segundoApellido,
              SEXO AS sexo, DATE_FORMAT(FECHA_NACIMIENTO, '%Y-%m-%d') AS fechaNacimiento,
              TRIM(CODIGO_MUNICIPIO) AS codigoMunicipio, ZONA AS zona,
              codigo_pais_nacimiento AS codigoPaisNacimiento, codigo_etnia AS codigoEtnia,
              codigo_discapacidad AS codigoDiscapacidad, codigo_identidad_genero AS codigoIdentidadGenero
       FROM usuarios WHERE ID = ? LIMIT 1`,
      [idUsuario],
    );
    return u ?? null;
  }

  private async especialista(idEspecialista: number): Promise<EspecialistaRda | null> {
    const [e] = await this.ds.query(
      `SELECT ID_TIPO_IDENTIFICACION AS idTipoIdentificacion, TRIM(IDENTIFICACION) AS identificacion, TRIM(NOMBRE) AS nombre,
              primer_nombre AS primerNombre, segundo_nombre AS segundoNombre,
              primer_apellido AS primerApellido, segundo_apellido AS segundoApellido
       FROM especialistas WHERE ID_ESPECIALISTA = ? LIMIT 1`,
      [idEspecialista],
    );
    return e ?? null;
  }

  private async prestador(c: ConfigRda): Promise<PrestadorRda> {
    const emp = await empresaPrestador(this.ds);
    return { codigoPrestadorReps: c.codigoPrestadorReps, nitPrestador: c.nitPrestador, nombre: emp?.nombre ?? '' };
  }

  /**
   * CUPS, diagnóstico y tipo ('C' consulta / 'P' procedimiento) del detalle de la orden.
   * Réplica de DRDAConsultaExterna.CargarDetalleOrden: si diagnostico1 está vacío se toma
   * el primer CIE-10 de la historia de la orden.
   */
  private async detalleOrden(idOrden: number, idDetalleOrden?: number | null, tipoPreferido?: string | null) {
    const DX = `COALESCE(NULLIF(TRIM(d.DIAGNOSTICO1),''),
                (SELECT hd.ID_DIAGNOSTICO FROM historia_diagnosticos hd WHERE hd.ID_ORDEN = d.ID_ORDEN ORDER BY hd.createdAt LIMIT 1))`;
    const sql = `SELECT d.ID AS id, d.TIPO AS tipo, TRIM(d.CODIGO_CUPS) AS cups, c.NOMBRE_CUPS AS nombreCups,
                        ${DX} AS dx, dg.NOMBRE_DIAGNOSTICO AS nombreDx
                 FROM detalle_orden d
                 LEFT JOIN cups c ON c.CODIGO_CUPS = d.CODIGO_CUPS
                 LEFT JOIN diagnosticos dg ON dg.CODIGO_DIAGNOSTICO = ${DX}
                 ${idDetalleOrden ? 'WHERE d.ID = ? LIMIT 1' : "WHERE d.ID_ORDEN = ? ORDER BY (IFNULL(d.TIPO,'C') = ?) DESC, d.ID ASC LIMIT 1"}`;
    const [r] = await this.ds.query(
      sql,
      idDetalleOrden ? [idDetalleOrden] : [String(idOrden), (tipoPreferido || 'C').trim().toUpperCase()],
    );
    if (!r) return null;
    const dx = String(r.dx ?? '').replace(/\./g, '').trim(); // en RDA el CIE-10 va sin punto
    return {
      id: Number(r.id),
      tipo: String(r.tipo ?? 'C').trim().toUpperCase(),
      cups: r.cups ?? '',
      nombreCups: r.nombreCups ?? r.cups ?? '',
      dx,
      nombreDx: (r.nombreDx ?? dx).trim(),
    };
  }

  /** Hora real de la atención: historia (creación → firma) o endoscopia (fecha y hora del estudio → firma). */
  private async periodo(idDetalleOrden: number, tipo: string): Promise<{ inicio: Date | null; fin: Date | null }> {
    const fila = tipo === 'P'
      ? (await this.ds.query(
          `SELECT TIMESTAMP(FECHA_ESTUDIO, IFNULL(HORA,'00:00:00')) AS inicio, fecha_firma AS fin FROM endoscopias WHERE ID_DETALLE_ORDEN = ? LIMIT 1`,
          [idDetalleOrden],
        ))[0]
      : (await this.ds.query(
          `SELECT COALESCE(createdAt, TIMESTAMP(FECHA_HISTORIA)) AS inicio, fecha_firma AS fin FROM historia_clinica WHERE ID_DETALLE_ORDEN = ? LIMIT 1`,
          [idDetalleOrden],
        ))[0];
    const aFecha = (v: unknown) => (v ? new Date(v as string) : null);
    return { inicio: aFecha(fila?.inicio), fin: aFecha(fila?.fin) };
  }

  /** PDF real (historia o estudio); si no se puede generar, un resumen mínimo (como el escritorio). */
  private async pdfBase64(idDetalleOrden: number, tipo: string, resumen: string): Promise<string> {
    try {
      const { buffer } = tipo === 'P' ? await this.pdf.endoscopia(idDetalleOrden) : await this.pdf.historia(idDetalleOrden);
      return buffer.toString('base64');
    } catch {
      const doc = new PDFDocument({ size: 'LETTER' });
      doc.fontSize(12).text(resumen.slice(0, 300));
      return (await pdfABuffer(doc)).toString('base64');
    }
  }

  // ───────────────────────────── Envíos ─────────────────────────────

  /**
   * Tras firmar una historia (tipo 'C') o un estudio (tipo 'P'): RDA-Paciente y RDA-Consulta
   * Externa en segundo plano. Nunca bloquea ni hace fallar la firma; el resultado queda en
   * rda_envios y en el historial. Si el proceso se cae a mitad, la orden aparece en
   * "Firmados sin RDA" para enviarla desde el historial.
   */
  enviarTrasFirma(p: { idOrden: number; idUsuario: number; idEspecialista: number; idDetalleOrden: number; tipo: 'C' | 'P' }) {
    setImmediate(async () => {
      try {
        await this.enviarPaciente(p.idOrden, p.idUsuario, p.idEspecialista);
        await this.enviarConsulta(p.idOrden, p.idUsuario, p.idEspecialista, p.idDetalleOrden, p.tipo);
      } catch (e) {
        this.log.error(`RDA tras la firma de la orden ${p.idOrden}: ${(e as Error).message}`);
      }
    });
  }

  private async preparar(idOrden: number, tipo: TipoDocumentoRda) {
    const c = await cargarConfigRda(this.ds);
    if (!c) {
      await this.registrar(idOrden, tipo, false, 'Sin configuración de interoperabilidad RDA.');
      return { error: 'No hay configuración de interoperabilidad RDA' } as const;
    }
    const bloqueo = motivoBloqueoAmbiente(c);
    if (bloqueo) {
      await this.registrar(idOrden, tipo, false, bloqueo);
      return { error: bloqueo } as const;
    }
    try {
      const { token } = await this.tokens.obtener(c);
      return { c, token } as const;
    } catch (e) {
      await this.registrar(idOrden, tipo, false, `No fue posible obtener un token de MinSalud. ${(e as Error).message}`);
      return { error: 'No fue posible obtener el token de MinSalud' } as const;
    }
  }

  /** RDA-Paciente (antecedentes declarados), con la consulta previa al MPI. */
  async enviarPaciente(idOrden: number, idUsuario: number, idEspecialista: number): Promise<ResultadoEnvio> {
    const TIPO: TipoDocumentoRda = 'RDA-PACIENTE';
    try {
      const paciente = await this.paciente(idUsuario);
      if (!paciente) {
        await this.registrar(idOrden, TIPO, false, `No se encontró el paciente id_usuario=${idUsuario}.`);
        return { exitoso: false, codigoHttp: null, mensaje: 'No se encontró el paciente' };
      }
      const prep = await this.preparar(idOrden, TIPO);
      if ('error' in prep) return { exitoso: false, codigoHttp: null, mensaje: prep.error! };
      const { c, token } = prep;
      const esp = await this.especialista(idEspecialista);

      // Consulta previa al MPI: si falla se deja aviso y se envía igual (como el escritorio).
      const tipoEsp = vacio(esp?.idTipoIdentificacion) ? 'CC' : esp!.idTipoIdentificacion!.trim();
      const humanuser = esp && !vacio(esp.identificacion) ? `${tipoEsp}-${esp.identificacion}` : 'CC-0';
      try {
        const mpi = await this.post(c, '/Patient/$consultar-paciente-exacto', {
          resourceType: 'Parameters',
          parameter: [
            { name: 'identifier', part: [{ name: 'type', valueString: paciente.idTipoIdentificacion }, { name: 'value', valueString: paciente.identificacion }] },
            { name: 'humanuser', valueString: humanuser },
          ],
        }, token);
        if (!mpi.ok) {
          await this.registrar(idOrden, 'RDA-PACIENTE-MPI', false, `Aviso: la consulta previa al MPI no fue exitosa (se intenta el envío igual). ${mpi.cuerpo}`, mpi.status);
        }
      } catch (e) {
        await this.registrar(idOrden, 'RDA-PACIENTE-MPI', false, `Aviso: excepción consultando el MPI (se intenta el envío igual). ${(e as Error).message}`);
      }

      const [ant] = await this.ds.query(
        'SELECT ANTECEDENTES_FAMILIARES AS familiares, ANTECEDENTES_PERSONALES AS personales FROM antecedentes WHERE ID_ORDEN = ? LIMIT 1',
        [idOrden],
      );
      const bundle = construirBundlePaciente({
        paciente,
        prestador: await this.prestador(c),
        antecedentesPersonales: ant?.personales,
        antecedentesFamiliares: ant?.familiares,
      });
      const r = await this.post(c, '/Composition/$enviar-rda-paciente', bundle, token);
      await this.registrar(idOrden, TIPO, r.ok, r.cuerpo, r.status, { bundle });
      return { exitoso: r.ok, codigoHttp: r.status, mensaje: r.ok ? 'MinSalud aceptó el RDA-Paciente' : `MinSalud rechazó el RDA-Paciente (HTTP ${r.status})` };
    } catch (e) {
      await this.registrar(idOrden, TIPO, false, `Excepción: ${(e as Error).message}`);
      return { exitoso: false, codigoHttp: null, mensaje: (e as Error).message };
    }
  }

  /**
   * RDA-Consulta Externa. Si el detalle es un procedimiento ('P') el CUPS va en
   * ServiceRequest y en Encounter.serviceType el CUPS de consulta 890246. Reintenta una vez
   * con el display oficial del CIE-10 si MinSalud lo rechaza por el texto.
   */
  async enviarConsulta(
    idOrden: number,
    idUsuario: number,
    idEspecialista: number,
    idDetalleOrden?: number | null,
    tipoPreferido?: string | null,
  ): Promise<ResultadoEnvio> {
    const TIPO: TipoDocumentoRda = 'RDA-CONSULTA-EXTERNA';
    try {
      const paciente = await this.paciente(idUsuario);
      if (!paciente) {
        await this.registrar(idOrden, TIPO, false, `No se encontró el paciente id_usuario=${idUsuario}.`, null, { idDetalleOrden });
        return { exitoso: false, codigoHttp: null, mensaje: 'No se encontró el paciente' };
      }
      const esp = await this.especialista(idEspecialista);
      if (!esp || vacio(esp.identificacion)) {
        await this.registrar(idOrden, TIPO, false, `No se encontró el especialista id_especialista=${idEspecialista} o no tiene identificación.`, null, { idDetalleOrden });
        return { exitoso: false, codigoHttp: null, mensaje: 'Faltan los datos del especialista' };
      }
      const det = await this.detalleOrden(idOrden, idDetalleOrden, tipoPreferido);
      if (!det) {
        await this.registrar(idOrden, TIPO, false, `No se encontró detalle_orden para id_orden=${idOrden}.`, null, { idDetalleOrden });
        return { exitoso: false, codigoHttp: null, mensaje: 'No se encontró el detalle de la orden' };
      }
      if (!det.dx) {
        await this.registrar(idOrden, TIPO, false, 'La atención no tiene diagnóstico CIE-10 (sin diagnóstico).', null, { idDetalleOrden: det.id });
        return { exitoso: false, codigoHttp: null, mensaje: 'La atención no tiene diagnóstico CIE-10' };
      }
      const prep = await this.preparar(idOrden, TIPO);
      if ('error' in prep) return { exitoso: false, codigoHttp: null, mensaje: prep.error! };
      const { c, token } = prep;

      const esProcedimiento = det.tipo === 'P';
      const servicio = repsServicio();
      const { inicio, fin } = await this.periodo(det.id, det.tipo);
      const pdfBase64 = await this.pdfBase64(det.id, det.tipo, `Resumen RDA - ${paciente.primerNombre ?? ''} ${paciente.primerApellido ?? ''} - Dx: ${det.nombreDx}`);
      const prestador = await this.prestador(c);

      let dxTexto = det.nombreDx;
      for (let intento = 1; intento <= 2; intento++) {
        const bundle = construirBundleConsultaExterna({
          paciente,
          especialista: esp,
          prestador,
          diagnosticoCodigo: det.dx,
          diagnosticoTexto: dxTexto,
          cupsConsultaCodigo: esProcedimiento ? CUPS_CONSULTA_ESPECIALISTA.codigo : det.cups,
          cupsConsultaTexto: esProcedimiento ? CUPS_CONSULTA_ESPECIALISTA.texto : det.nombreCups,
          repsServicioCodigo: servicio.codigo,
          repsServicioTexto: servicio.texto,
          cupsProcedimientoCodigo: esProcedimiento ? det.cups : null,
          cupsProcedimientoTexto: esProcedimiento ? det.nombreCups : null,
          inicio,
          fin,
          pdfBase64,
        });
        const r = await this.post(c, '/Composition/$enviar-rda-consulta', bundle, token);
        if (!r.ok && intento === 1) {
          const oficial = displayOficialCie10(r.cuerpo, det.dx);
          if (oficial && oficial !== dxTexto) {
            await this.registrar(idOrden, TIPO, false, r.cuerpo, r.status, { idDetalleOrden: det.id, bundle });
            dxTexto = oficial;
            continue;
          }
        }
        await this.registrar(idOrden, TIPO, r.ok, r.cuerpo, r.status, { idDetalleOrden: det.id, bundle });
        return { exitoso: r.ok, codigoHttp: r.status, mensaje: r.ok ? 'MinSalud aceptó el RDA de la atención' : `MinSalud rechazó el RDA de la atención (HTTP ${r.status})` };
      }
      return { exitoso: false, codigoHttp: null, mensaje: 'MinSalud rechazó el RDA de la atención' };
    } catch (e) {
      await this.registrar(idOrden, TIPO, false, `Excepción: ${(e as Error).message}`, null, { idDetalleOrden });
      return { exitoso: false, codigoHttp: null, mensaje: (e as Error).message };
    }
  }

  // ───────────────────────────── Historial ─────────────────────────────

  async historial(f: { desde?: string; hasta?: string; estado?: string; q?: string }) {
    const where: string[] = [];
    const params: unknown[] = [];
    if (f.desde) { where.push('r.fecha_envio >= ?'); params.push(`${f.desde} 00:00:00`); }
    if (f.hasta) { where.push('r.fecha_envio <= ?'); params.push(`${f.hasta} 23:59:59`); }
    if (f.q?.trim()) {
      const t = `%${f.q.trim()}%`;
      where.push(`(u.IDENTIFICACION LIKE ? OR CONCAT_WS(' ', u.PRIMER_NOMBRE, u.SEGUNDO_NOMBRE, u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO) LIKE ?
                  OR o.CONSECUTIVO LIKE ? OR CAST(r.id_orden AS CHAR) = ? OR r.composition_id LIKE ?)`);
      params.push(t, t, t, f.q.trim(), t);
    }
    const filas = await this.ds.query(
      `SELECT r.id, r.fecha_envio AS fechaEnvio, r.tipo_documento AS tipoDocumento, r.exitoso, r.codigo_http AS codigoHttp,
              r.id_orden AS idOrden, o.CONSECUTIVO AS consecutivo, r.composition_id AS compositionId,
              TRIM(CONCAT_WS(' ', u.PRIMER_NOMBRE, u.SEGUNDO_NOMBRE, u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO)) AS paciente,
              CONCAT_WS(' ', u.ID_TIPO_IDENTIFICACION, u.IDENTIFICACION) AS documento,
              LEFT(r.detalle, 4000) AS detalle,
              (SELECT COUNT(*) FROM rda_envios r2 WHERE r2.id_orden = r.id_orden AND r2.tipo_documento = r.tipo_documento
                 AND r2.exitoso = 1 AND r2.id > r.id) AS corregidoDespues
       FROM rda_envios r
       LEFT JOIN ordenes o ON o.ID = r.id_orden
       LEFT JOIN usuarios u ON u.ID = o.ID_USUARIO
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY r.fecha_envio DESC, r.id DESC
       LIMIT 1000`,
      params,
    );
    let lista = filas.map((r: any) => {
      const exitoso = Number(r.exitoso) === 1;
      const corregido = !exitoso && Number(r.corregidoDespues) > 0;
      const aviso = r.tipoDocumento === 'RDA-PACIENTE-MPI';
      const estado = exitoso ? 'OK' : corregido || aviso ? 'CORREGIDO' : 'ERROR';
      const exp = explicarResultado(exitoso, corregido, r.codigoHttp == null ? null : Number(r.codigoHttp), r.detalle ?? '');
      return {
        id: r.id,
        fechaEnvio: r.fechaEnvio,
        tipoDocumento: r.tipoDocumento,
        documento: nombreDocumento(r.tipoDocumento),
        estado,
        codigoHttp: r.codigoHttp,
        idOrden: r.idOrden,
        consecutivo: r.consecutivo,
        compositionId: r.compositionId,
        paciente: r.paciente,
        documentoPaciente: r.documento,
        resultado: aviso && !exitoso ? `Aviso: ${exp.resultado}` : exp.resultado,
        queHacer: aviso && !exitoso ? 'Solo informativo: el documento se envió igual. Revise el resultado del RDA-Paciente.' : exp.queHacer,
        reenviable: !exitoso,
      };
    });
    if (f.estado && ['OK', 'ERROR', 'CORREGIDO'].includes(f.estado)) lista = lista.filter((r: any) => r.estado === f.estado);
    return {
      resumen: {
        total: lista.length,
        aceptados: lista.filter((r: any) => r.estado === 'OK').length,
        errores: lista.filter((r: any) => r.estado === 'ERROR').length,
        corregidos: lista.filter((r: any) => r.estado === 'CORREGIDO').length,
      },
      envios: lista,
    };
  }

  /** Respuesta técnica completa y Bundle enviado (sin el PDF). */
  async detalleEnvio(id: number) {
    let fila: any;
    try {
      [fila] = await this.ds.query('SELECT id, detalle, bundle, composition_id AS compositionId, codigo_http AS codigoHttp FROM rda_envios WHERE id = ?', [id]);
    } catch {
      [fila] = await this.ds.query('SELECT id, detalle, composition_id AS compositionId, codigo_http AS codigoHttp FROM rda_envios WHERE id = ?', [id]);
    }
    if (!fila) throw new NotFoundException('Envío no encontrado');
    return fila;
  }

  /** Reenvío manual desde el historial (DRDAPaciente.DatosParaReenvio). */
  async reenviar(id: number): Promise<ResultadoEnvio> {
    let r: any;
    try {
      [r] = await this.ds.query('SELECT id_orden AS idOrden, tipo_documento AS tipo, id_detalle_orden AS idDetalle FROM rda_envios WHERE id = ?', [id]);
    } catch {
      [r] = await this.ds.query('SELECT id_orden AS idOrden, tipo_documento AS tipo, NULL AS idDetalle FROM rda_envios WHERE id = ?', [id]);
    }
    if (!r) throw new NotFoundException('Envío no encontrado');
    return this.enviarOrden(Number(r.idOrden), r.tipo, r.idDetalle ? Number(r.idDetalle) : null);
  }

  /** Envía (o reenvía) el RDA de una orden firmada: el documento indicado o los dos. */
  async enviarOrden(idOrden: number, tipo: string | null, idDetalleOrden: number | null): Promise<ResultadoEnvio> {
    const [o] = await this.ds.query(
      `SELECT o.ID_USUARIO AS idUsuario, o.ID_EMPLEADO AS idEmpleado,
              (SELECT hc.usuario_firma FROM historia_clinica hc WHERE hc.ID_ORDEN = o.ID AND hc.usuario_firma IS NOT NULL LIMIT 1) AS firmaHistoria,
              (SELECT e.usuario_firma FROM endoscopias e WHERE e.ID_ORDEN = o.ID AND e.usuario_firma IS NOT NULL LIMIT 1) AS firmaEstudio,
              (SELECT COUNT(*) FROM historia_clinica hc2 WHERE hc2.ID_ORDEN = o.ID) AS conHistoria
       FROM ordenes o WHERE o.ID = ?`,
      [idOrden],
    );
    if (!o) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    const idEspecialista = Number(o.firmaHistoria || o.firmaEstudio || o.idEmpleado);
    const tipoPreferido = Number(o.conHistoria) > 0 ? 'C' : 'P';
    if (tipo === 'RDA-PACIENTE' || tipo === 'RDA-PACIENTE-MPI') return this.enviarPaciente(idOrden, Number(o.idUsuario), idEspecialista);
    if (tipo === 'RDA-CONSULTA-EXTERNA') return this.enviarConsulta(idOrden, Number(o.idUsuario), idEspecialista, idDetalleOrden, tipoPreferido);
    const p = await this.enviarPaciente(idOrden, Number(o.idUsuario), idEspecialista);
    const ce = await this.enviarConsulta(idOrden, Number(o.idUsuario), idEspecialista, idDetalleOrden, tipoPreferido);
    return { exitoso: p.exitoso && ce.exitoso, codigoHttp: ce.codigoHttp, mensaje: `${p.mensaje}. ${ce.mensaje}.` };
  }

  /**
   * Historias y estudios firmados en la web (con fecha de firma) de los últimos días que
   * no tienen un RDA de la atención aceptado: hace de cola de recuperación.
   */
  async pendientes() {
    const filas = await this.ds.query(
      `SELECT x.* FROM (
         SELECT 'Historia clínica' AS origen, h.ID_ORDEN AS idOrden, h.ID_DETALLE_ORDEN AS idDetalleOrden, h.fecha_firma AS fechaFirma
         FROM historia_clinica h WHERE h.firmada = 1 AND h.fecha_firma >= DATE_SUB(NOW(), INTERVAL ? DAY)
         UNION ALL
         SELECT 'Endoscopia', e.ID_ORDEN, e.ID_DETALLE_ORDEN, e.fecha_firma
         FROM endoscopias e WHERE e.firmada = 1 AND e.fecha_firma >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ) x
       WHERE NOT EXISTS (SELECT 1 FROM rda_envios r WHERE r.id_orden = x.idOrden
                         AND r.tipo_documento = 'RDA-CONSULTA-EXTERNA' AND r.exitoso = 1)
       ORDER BY x.fechaFirma DESC LIMIT 300`,
      [DIAS_PENDIENTES, DIAS_PENDIENTES],
    );
    if (!filas.length) return [];
    const ids = [...new Set(filas.map((f: any) => f.idOrden))];
    const info = await this.ds.query(
      `SELECT o.ID AS idOrden, o.CONSECUTIVO AS consecutivo,
              TRIM(CONCAT_WS(' ', u.PRIMER_NOMBRE, u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO)) AS paciente,
              CONCAT_WS(' ', u.ID_TIPO_IDENTIFICACION, u.IDENTIFICACION) AS documento,
              (SELECT COUNT(*) FROM rda_envios r WHERE r.id_orden = o.ID) AS intentos
       FROM ordenes o LEFT JOIN usuarios u ON u.ID = o.ID_USUARIO WHERE o.ID IN (${ids.map(() => '?').join(',')})`,
      ids,
    );
    const porOrden = new Map(info.map((i: any) => [i.idOrden, i]));
    return filas.map((f: any) => ({ ...f, ...(porOrden.get(f.idOrden) as object) }));
  }
}

/** composition_id que asigna MinSalud (busca el recurso Composition en la respuesta). */
export function extraerCompositionId(respuesta: string): string | null {
  try {
    const raiz = JSON.parse(respuesta);
    let id: string | null = null;
    const buscar = (n: any) => {
      if (id || !n || typeof n !== 'object') return;
      if (n.resourceType === 'Composition' && typeof n.id === 'string') {
        id = n.id;
        return;
      }
      Object.values(n).forEach(buscar);
    };
    buscar(raiz);
    return id;
  } catch {
    return null;
  }
}

/** Copia del Bundle sin el PDF del DocumentReference (para guardarlo en rda_envios). */
function sinPdf(bundle: Json): Json {
  const copia = JSON.parse(JSON.stringify(bundle));
  for (const e of copia.entry ?? []) {
    for (const c of e?.resource?.content ?? []) {
      if (c?.attachment?.data) c.attachment.data = `[PDF omitido: ${Math.round((c.attachment.data.length * 3) / 4)} bytes]`;
    }
  }
  return copia;
}
