import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { leerArchivoImagen } from '../endoscopias/imagenes-archivo';
import {
  PDFDocument,
  registrarFuentes,
  FUENTES,
  pdfABuffer,
  fechaCorta,
  edadAniosMeses,
  nombreArchivoSeguro,
} from '../reportes/pdf-utils';
import { renderHtml, htmlVacio } from '../reportes/html-pdf';
import { empresaPrestador } from './empresa-prestador';

/** Mismo criterio que el frontend (ESTUDIO_PRIMERA_VEZ) y frmHistoria de SIM-ENDOSCOPIA. */
const ESTUDIO_PRIMERA_VEZ = 'CONSULTA PRIMERA VEZ';

function pestanasPorEstudio(estudio?: string | null) {
  const t = (estudio ?? '').toUpperCase();
  if (t.includes('COLONOSCOPIA')) return { campo2: 'INSPECCIÓN', campo3: 'TACTO', campo4: 'COLONOSCOPIA', elcb: true };
  if (t.includes('RECTOSCOPIA')) return { campo2: 'INSPECCIÓN', campo3: 'TACTO', campo4: 'RECTOSCOPIA', elcb: false };
  return { campo2: 'ESÓFAGO', campo3: 'ESTÓMAGO', campo4: 'DUODENO', elcb: false };
}

const MARGEN = 42;
const GRIS = '#EEF1F5';
const AZUL = '#1F3A5F';

const escapar = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

function fechaHoraTexto(v: Date | string | null | undefined) {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const MAX_FOTOS_INFORME = 9;

interface FotoInforme {
  buffer: Buffer;
  texto: string;
}

interface DatosComunes {
  titulo: string;
  numero: string;
  fecha: string;
  paciente: Record<string, any>;
  entidad: string | null;
  especialista: Record<string, any> | null;
  firmada: boolean;
  fechaFirma: Date | string | null;
  adendas: { texto: string; fechaHora: Date | string; autor: string | null }[];
}

/**
 * Informes PDF de GASTROLAP (historia clínica y estudios de endoscopia). Reemplazan
 * rptHistoriaClinicaGL y rptImg*GL (Crystal Reports del escritorio): mismo contenido,
 * diseño nuevo. También son el adjunto del DocumentReference del RDA.
 */
@Injectable()
export class InformesClinicosPdfService {
  constructor(private readonly dataSource: DataSource) {}

  // ───────────────────────────── Historia clínica ─────────────────────────────

  async historia(idDetalleOrden: number): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const [h] = await this.dataSource.query(
      `SELECT h.*, o.CONSECUTIVO AS consecutivo, o.ID_USUARIO AS idUsuario, o.ID_CONTRATO AS idContrato,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, c.NOMBRE_CUPS AS nombreCups
       FROM historia_clinica h
       INNER JOIN ordenes o ON o.ID = h.ID_ORDEN
       INNER JOIN detalle_orden d ON d.ID = h.ID_DETALLE_ORDEN
       LEFT JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       LEFT JOIN cups c ON c.CODIGO_CUPS = d.CODIGO_CUPS
       WHERE h.ID_DETALLE_ORDEN = ? LIMIT 1`,
      [idDetalleOrden],
    );
    if (!h) throw new NotFoundException('No hay historia clínica registrada para esta línea de orden');

    const primeraVez = (h.estudio ?? '').trim().toUpperCase() === ESTUDIO_PRIMERA_VEZ;
    const [ant] = await this.dataSource.query(
      'SELECT ANTECEDENTES_FAMILIARES AS familiares, ANTECEDENTES_PERSONALES AS personales FROM antecedentes WHERE ID_ORDEN = ? LIMIT 1',
      [h.ID_ORDEN],
    );
    const dx = await this.dataSource.query(
      `SELECT hd.ID_DIAGNOSTICO AS codigo, dg.NOMBRE_DIAGNOSTICO AS nombre, hd.DESCRIPCION AS nota
       FROM historia_diagnosticos hd LEFT JOIN diagnosticos dg ON dg.CODIGO_DIAGNOSTICO = hd.ID_DIAGNOSTICO
       WHERE hd.ID_DETALLE_ORDEN = ? ORDER BY hd.createdAt ASC`,
      [idDetalleOrden],
    );
    const meds = await this.consultaSegura(
      `SELECT m.NOMBRE AS nombre, hm.DOSIS AS dosis, hm.CANTIDAD AS cantidad, v.NOMBRE AS via, hm.DESCRIPCION AS indicaciones
       FROM historia_medicamentos hm
       LEFT JOIN medicamentos m ON m.ID = hm.ID_MEDICAMENTO
       LEFT JOIN via_administracion v ON v.ID = hm.ID_VIA_ADMINISTRACION
       WHERE hm.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
    const labs = await this.consultaSegura(
      `SELECT hl.ID_LABORATORIO AS codigo, c.NOMBRE_CUPS AS nombre, hl.DESCRIPCION AS nota
       FROM historia_laboratorios hl LEFT JOIN cups c ON c.CODIGO_CUPS = hl.ID_LABORATORIO
       WHERE hl.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
    const procs = await this.consultaSegura(
      `SELECT hp.ID_PROCEDIMIENTO AS codigo, c.NOMBRE_CUPS AS nombre, hp.DESCRIPCION AS nota
       FROM historia_procedimientos hp LEFT JOIN cups c ON c.CODIGO_CUPS = hp.ID_PROCEDIMIENTO
       WHERE hp.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
    const rxs = await this.consultaSegura(
      `SELECT r.NOMBRE AS sistema, hr.DESCRIPCION AS hallazgo
       FROM historia_rxs hr LEFT JOIN revision_sistemas r ON r.ID = hr.ID_RXS
       WHERE hr.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
    const adendas = await this.dataSource.query(
      `SELECT a.texto, a.fecha_hora AS fechaHora, e.NOMBRE AS autor
       FROM historia_clinica_adendas a LEFT JOIN especialistas e ON e.ID_ESPECIALISTA = a.id_usuario
       WHERE a.id_historia = ? ORDER BY a.fecha_hora, a.id`,
      [h.ID],
    );

    const comunes = await this.datosComunes({
      titulo: primeraVez ? 'HISTORIA CLÍNICA - CONSULTA DE PRIMERA VEZ' : 'HISTORIA CLÍNICA - CONSULTA DE CONTROL',
      numero: h.consecutivo ?? String(h.ID_ORDEN),
      fecha: fechaCorta(h.FECHA_HISTORIA),
      idUsuario: h.idUsuario,
      idContrato: h.idContrato,
      idEspecialista: h.usuario_firma ?? h.ID_ESPECIALISTA,
      firmada: h.firmada === 1 || h.ESTADO === 'C',
      fechaFirma: h.fecha_firma,
      adendas,
    });

    const lista = (filas: { codigo?: string; nombre?: string; nota?: string }[]) =>
      filas
        .map((f) => `<li>${escapar([f.codigo, f.nombre].filter(Boolean).join(' - '))}${f.nota ? ` <i>(${escapar(f.nota)})</i>` : ''}</li>`)
        .join('');

    const secciones: [string, string][] = [];
    if (h.RESPONSABLES) secciones.push(['RESPONSABLES / ACOMPAÑANTE', escapar(h.RESPONSABLES)]);
    if (primeraVez) {
      secciones.push(['MOTIVO DE CONSULTA', h.MOTIVO_CONSULTA ?? '']);
      secciones.push([
        'ANTECEDENTES',
        `<b>Familiares:</b> ${escapar(ant?.familiares || 'No refiere')}<br><b>Personales:</b> ${escapar(ant?.personales || 'No refiere')}`,
      ]);
      secciones.push(['ENFERMEDAD ACTUAL', h.ENFERMEDAD_ACTUAL ?? '']);
      const rxsHtml = (h.REVISIONXSISTEMAS ?? '') + (rxs.length ? `<ul>${rxs.map((r: any) => `<li><b>${escapar(r.sistema ?? '')}:</b> ${escapar(r.hallazgo ?? '')}</li>`).join('')}</ul>` : '');
      secciones.push(['REVISIÓN POR SISTEMAS', rxsHtml]);
    } else {
      secciones.push(['CONSULTA DE CONTROL / EVOLUCIÓN', h.CONSULTA_CONTROL ?? '']);
    }
    const signos = [
      h.PESO ? `Peso: ${h.PESO} kg` : '',
      h.TALLA ? `Talla: ${h.TALLA} cm` : '',
      h.TENSION_ARTERIAL ? `TA: ${h.TENSION_ARTERIAL}` : '',
      h.FRECUENCIA_CARDIACA ? `FC: ${h.FRECUENCIA_CARDIACA}` : '',
      h.FRECUENCIA_RESPIRATORIA ? `FR: ${h.FRECUENCIA_RESPIRATORIA}` : '',
      h.TEMPERATURA ? `T°: ${h.TEMPERATURA}` : '',
    ].filter(Boolean);
    secciones.push(['EXAMEN FÍSICO', (signos.length ? `<b>${signos.join(' · ')}</b><br>` : '') + (h.EXAMEN_FISICO ?? '')]);
    secciones.push(['DIAGNÓSTICO', (h.DIAGNOSTICO ?? '') + (dx.length ? `<ul>${lista(dx)}</ul>` : '')]);
    secciones.push(['ANÁLISIS Y PLAN A SEGUIR', h.PLAN_SEGUIR ?? '']);
    secciones.push(['RECOMENDACIONES', h.RECOMENDACIONES ?? '']);
    secciones.push([
      'FORMULACIÓN',
      (h.FORMULACION ?? '') +
        (meds.length
          ? `<ul>${meds.map((m: any) => `<li>${escapar(`${m.nombre ?? ''} — ${m.dosis ?? ''} x ${m.cantidad ?? ''} (${m.via ?? ''})${m.indicaciones ? `. ${m.indicaciones}` : ''}`)}</li>`).join('')}</ul>`
          : ''),
    ]);
    secciones.push(['LABORATORIOS', (h.LABORATORIOS ?? '') + (labs.length ? `<ul>${lista(labs)}</ul>` : '')]);
    secciones.push(['PROCEDIMIENTOS', procs.length ? `<ul>${lista(procs)}</ul>` : '']);
    secciones.push(['ESTUDIOS DIAGNÓSTICOS', h.ESTUDIOS_DIAGNOSTICOS ?? '']);
    secciones.push(['OTROS ESTUDIOS', h.OTROS_ESTUDIOS ?? '']);

    const buffer = await this.dibujar(comunes, secciones);
    const p = comunes.paciente;
    return {
      buffer,
      nombreArchivo: nombreArchivoSeguro(`Historia ${comunes.numero} - ${p.PRIMER_NOMBRE ?? ''} ${p.PRIMER_APELLIDO ?? ''}`) + '.pdf',
    };
  }

  // ───────────────────────────── Endoscopia ─────────────────────────────

  async endoscopia(idDetalleOrden: number): Promise<{ buffer: Buffer; nombreArchivo: string }> {
    const [e] = await this.dataSource.query(
      `SELECT e.*, o.CONSECUTIVO AS consecutivo, o.ID_USUARIO AS idUsuario, o.ID_CONTRATO AS idContrato,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, c.NOMBRE_CUPS AS nombreCups, dg.NOMBRE_DIAGNOSTICO AS nombreDiagnostico
       FROM endoscopias e
       INNER JOIN ordenes o ON o.ID = e.ID_ORDEN
       INNER JOIN detalle_orden d ON d.ID = e.ID_DETALLE_ORDEN
       LEFT JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       LEFT JOIN cups c ON c.CODIGO_CUPS = d.CODIGO_CUPS
       LEFT JOIN diagnosticos dg ON dg.CODIGO_DIAGNOSTICO = e.CODIGO_DIAGNOSTICO
       WHERE e.ID_DETALLE_ORDEN = ? LIMIT 1`,
      [idDetalleOrden],
    );
    if (!e) throw new NotFoundException('No hay reporte de endoscopia registrado para esta línea de orden');
    const [equipo] = await this.consultaSegura('SELECT NOMBRE AS nombre FROM equipos WHERE ID = ? LIMIT 1', [e.ID_EQUIPO]);
    const [proc] = await this.consultaSegura(
      'SELECT NOMBRE AS nombre FROM procedimientos_terapeuticos WHERE ID = ? LIMIT 1',
      [e.ID_PROCEDIMIENTO_TERAPEUTICO],
    );
    const adendas = await this.dataSource.query(
      `SELECT a.texto, a.fecha_hora AS fechaHora, s.NOMBRE AS autor
       FROM endoscopias_adendas a LEFT JOIN especialistas s ON s.ID_ESPECIALISTA = a.id_usuario
       WHERE a.id_endoscopia = ? ORDER BY a.fecha_hora, a.id`,
      [e.ID],
    );
    const pest = pestanasPorEstudio(e.estudio);

    const comunes = await this.datosComunes({
      titulo: `INFORME DE ${(e.estudio ?? 'ENDOSCOPIA').toUpperCase()}`,
      numero: e.consecutivo ?? String(e.ID_ORDEN),
      fecha: fechaCorta(e.FECHA_ESTUDIO),
      idUsuario: e.idUsuario,
      idContrato: e.idContrato,
      idEspecialista: e.usuario_firma ?? e.ID_EMPLEADO,
      firmada: e.firmada === 1,
      fechaFirma: e.fecha_firma,
      adendas,
    });

    const datos = [
      ['Procedimiento', e.nombreCups],
      ['Médico que solicita', e.MEDICO_SOLICITA],
      ['Indicación', e.INDICACION],
      ['Equipo', equipo?.nombre],
      ['Anestesiólogo', e.ANESTESIOLOGO],
      ['Medicamentos', e.MEDICAMENTOS],
      ['Procedimiento terapéutico', proc?.nombre],
    ]
      .filter(([, v]) => v && String(v).trim())
      .map(([k, v]) => `<b>${k}:</b> ${escapar(String(v))}`)
      .join('<br>');

    const secciones: [string, string][] = [
      ['DATOS DEL PROCEDIMIENTO', datos],
      ['DESCRIPCIÓN', e.CAMPO1 ?? ''],
      [pest.campo2, e.CAMPO2 ?? ''],
      [pest.campo3, e.CAMPO3 ?? ''],
      [pest.campo4, e.CAMPO4 ?? ''],
    ];
    if (pest.elcb && e.CAMPO5 && e.CAMPO5.trim() !== '.') secciones.push(['ELCB', escapar(e.CAMPO5)]);
    secciones.push([
      'DIAGNÓSTICO',
      (e.DIAGNOSTICO ?? '') + (e.CODIGO_DIAGNOSTICO ? `<p><b>CIE-10:</b> ${escapar([e.CODIGO_DIAGNOSTICO, e.nombreDiagnostico].filter(Boolean).join(' - '))}</p>` : ''),
    ]);
    secciones.push([
      'TOMA DE BIOPSIA',
      e.TOMA_BIOPSIA === 'SI' ? `<b>SÍ.</b> ${escapar(e.BIOPSIA ?? '')}` : 'No se tomó biopsia.',
    ]);

    const fotos = await this.fotosInforme(idDetalleOrden);
    const buffer = await this.dibujar(comunes, secciones, fotos);
    const p = comunes.paciente;
    return {
      buffer,
      nombreArchivo: nombreArchivoSeguro(`${e.estudio ?? 'Endoscopia'} ${comunes.numero} - ${p.PRIMER_NOMBRE ?? ''} ${p.PRIMER_APELLIDO ?? ''}`) + '.pdf',
    };
  }

  /**
   * Fotos seleccionadas para el informe del procedimiento (ESTADO='A', máx. 9, en el orden
   * elegido), como imgendoscopia.rpt del escritorio. Las que no tienen archivo en el servidor
   * (históricas que siguen en el equipo de captura) se omiten.
   */
  private async fotosInforme(idDetalleOrden: number): Promise<FotoInforme[]> {
    let filas: { RUTA: string; TEXTO: string | null }[];
    try {
      filas = await this.dataSource.query(
        `SELECT RUTA, TEXTO FROM imagenes
         WHERE ID_DETALLE_ORDEN = ? AND ESTADO = 'A' AND eliminada = 0
         ORDER BY COALESCE(orden_informe, 99), ID LIMIT ${MAX_FOTOS_INFORME}`,
        [idDetalleOrden],
      );
    } catch {
      // Base sin la migración 009: la regla del escritorio, sin orden ni borrado lógico.
      filas = await this.consultaSegura(
        `SELECT RUTA, TEXTO FROM imagenes WHERE ID_DETALLE_ORDEN = ? AND ESTADO = 'A' ORDER BY ID LIMIT ${MAX_FOTOS_INFORME}`,
        [idDetalleOrden],
      );
    }
    const fotos: FotoInforme[] = [];
    for (const f of filas) {
      const buffer = await leerArchivoImagen(f.RUTA);
      if (buffer) fotos.push({ buffer, texto: (f.TEXTO ?? '').trim() });
    }
    return fotos;
  }

  // ───────────────────────────── Comunes ─────────────────────────────

  /** Las tablas hijas varían entre bases; si una no existe el informe sale sin esa lista. */
  private async consultaSegura(sql: string, params: unknown[]) {
    try {
      return await this.dataSource.query(sql, params);
    } catch {
      return [];
    }
  }

  private async datosComunes(a: {
    titulo: string;
    numero: string;
    fecha: string;
    idUsuario: number;
    idContrato: number | null;
    idEspecialista: number | null;
    firmada: boolean;
    fechaFirma: Date | string | null;
    adendas: DatosComunes['adendas'];
  }): Promise<DatosComunes> {
    const [paciente] = await this.dataSource.query('SELECT * FROM usuarios WHERE ID = ? LIMIT 1', [a.idUsuario]);
    const [ent] = a.idContrato
      ? await this.consultaSegura(
          `SELECT en.NOMBRE_ENTIDAD AS nombre FROM contratos c INNER JOIN entidades en ON en.CODIGO_ENTIDAD = c.CODIGO_ENTIDAD WHERE c.ID = ? LIMIT 1`,
          [a.idContrato],
        )
      : [];
    const [especialista] = a.idEspecialista
      ? await this.dataSource.query('SELECT * FROM especialistas WHERE ID_ESPECIALISTA = ? LIMIT 1', [a.idEspecialista])
      : [];
    return {
      titulo: a.titulo,
      numero: a.numero,
      fecha: a.fecha,
      paciente: paciente ?? {},
      entidad: ent?.nombre ?? null,
      especialista: especialista ?? null,
      firmada: a.firmada,
      fechaFirma: a.fechaFirma,
      adendas: a.adendas,
    };
  }

  private async dibujar(d: DatosComunes, secciones: [string, string][], fotos: FotoInforme[] = []): Promise<Buffer> {
    const empresa = await empresaPrestador(this.dataSource);
    const doc = new PDFDocument({
      size: 'LETTER',
      bufferPages: true,
      margins: { left: MARGEN, right: MARGEN, top: MARGEN, bottom: MARGEN + 18 },
      info: { Title: `${d.titulo} ${d.numero}`, Author: empresa?.nombre ?? 'SIM', Creator: 'SIM - Sistema Integrado Medico' },
    });
    registrarFuentes(doc);
    const ancho = doc.page.width - MARGEN * 2;
    const p = d.paciente;

    // ── Encabezado ──
    let xTexto = MARGEN;
    if (empresa?.logo?.length) {
      try {
        doc.image(empresa.logo, MARGEN, MARGEN, { fit: [110, 55] });
        xTexto = MARGEN + 120;
      } catch {
        /* logo inválido: se omite */
      }
    }
    doc.fillColor(AZUL).font(FUENTES.calibriBold).fontSize(13).text(empresa?.nombre ?? '', xTexto, MARGEN, { width: ancho - (xTexto - MARGEN) });
    doc
      .fillColor('#444')
      .font(FUENTES.calibri)
      .fontSize(8.5)
      .text(
        [empresa?.identificacion ? `NIT ${empresa.identificacion}` : '', empresa?.direccion, empresa?.telefono ? `Tel. ${empresa.telefono}` : '', empresa?.ciudad]
          .filter(Boolean)
          .join(' · '),
        xTexto,
        doc.y + 1,
        { width: ancho - (xTexto - MARGEN) },
      );
    doc.y = Math.max(doc.y, MARGEN + 58) + 6;

    doc.rect(MARGEN, doc.y, ancho, 22).fill(AZUL);
    doc.fillColor('white').font(FUENTES.calibriBold).fontSize(11).text(d.titulo, MARGEN + 8, doc.y + 6, { width: ancho - 160 });
    doc.font(FUENTES.calibri).fontSize(9).text(`Orden ${d.numero} · ${d.fecha}`, MARGEN, doc.y - 12, { width: ancho - 8, align: 'right' });
    doc.y += 12;

    // ── Paciente ──
    const nombre = [p.PRIMER_NOMBRE, p.SEGUNDO_NOMBRE, p.PRIMER_APELLIDO, p.SEGUNDO_APELLIDO].filter(Boolean).join(' ');
    const filas = [
      ['Paciente', nombre],
      ['Identificación', `${p.ID_TIPO_IDENTIFICACION ?? ''} ${p.IDENTIFICACION ?? ''}`.trim()],
      ['Edad', edadAniosMeses(p.FECHA_NACIMIENTO ? new Date(p.FECHA_NACIMIENTO).toISOString() : null)],
      ['Sexo', p.SEXO === 'M' ? 'Masculino' : p.SEXO === 'F' ? 'Femenino' : ''],
      ['Entidad', d.entidad ?? ''],
      ['Teléfono', p.TELEFONO ?? ''],
    ];
    const yIni = doc.y;
    doc.rect(MARGEN, yIni, ancho, 46).fill(GRIS);
    filas.forEach(([k, v], i) => {
      const col = i % 3;
      const fila = Math.floor(i / 3);
      const x = MARGEN + 8 + col * (ancho / 3);
      const y = yIni + 6 + fila * 18;
      doc.fillColor('#666').font(FUENTES.calibri).fontSize(7.5).text(k.toUpperCase(), x, y, { width: ancho / 3 - 12, lineBreak: false });
      // Una sola línea: si el valor (p. ej. un nombre largo) no cabe, se reduce la letra hasta 7 pt
      // y, si aun así no cabe, se corta con "…". Antes pasaba a una segunda línea y tapaba la fila de abajo.
      const anchoCelda = ancho / 3 - 12;
      const valor = v || '—';
      doc.font(FUENTES.calibriBold);
      let tam = 9;
      while (tam > 7 && doc.fontSize(tam).widthOfString(valor) > anchoCelda) tam -= 0.5;
      doc.fillColor('black').fontSize(tam).text(valor, x, y + 8, { width: anchoCelda, height: tam + 2, lineBreak: false, ellipsis: true });
    });
    doc.y = yIni + 54;

    // ── Secciones ──
    for (const [titulo, html] of secciones) {
      if (htmlVacio(html)) continue;
      if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      doc.fillColor(AZUL).font(FUENTES.calibriBold).fontSize(9.5).text(titulo, MARGEN, doc.y);
      doc.moveTo(MARGEN, doc.y + 1).lineTo(MARGEN + ancho, doc.y + 1).lineWidth(0.5).strokeColor('#B8C4D6').stroke();
      doc.y += 4;
      doc.fillColor('black');
      renderHtml(doc, html, MARGEN, ancho, { familia: 'arial', tamano: 9.25 });
      doc.y += 8;
    }

    // ── Fotos del procedimiento (cuadrícula de 3 columnas) ──
    if (fotos.length) {
      const fondoPagina = () => doc.page.height - doc.page.margins.bottom;
      const sep = 8;
      const anchoFoto = (ancho - sep * 2) / 3;
      const altoFoto = anchoFoto * 0.75;
      const altoTexto = 22;
      if (doc.y + 30 + altoFoto > fondoPagina()) doc.addPage();
      doc.fillColor(AZUL).font(FUENTES.calibriBold).fontSize(9.5).text('IMÁGENES DEL PROCEDIMIENTO', MARGEN, doc.y);
      doc.moveTo(MARGEN, doc.y + 1).lineTo(MARGEN + ancho, doc.y + 1).lineWidth(0.5).strokeColor('#B8C4D6').stroke();
      doc.y += 6;
      for (let i = 0; i < fotos.length; i += 3) {
        if (doc.y + altoFoto + altoTexto > fondoPagina()) doc.addPage();
        const yFila = doc.y;
        fotos.slice(i, i + 3).forEach((f, j) => {
          const x = MARGEN + j * (anchoFoto + sep);
          doc.rect(x, yFila, anchoFoto, altoFoto).fill('#111');
          try {
            doc.image(f.buffer, x, yFila, { fit: [anchoFoto, altoFoto], align: 'center', valign: 'center' });
          } catch {
            doc.fillColor('#ccc').font(FUENTES.calibri).fontSize(8).text('Imagen no válida', x, yFila + altoFoto / 2 - 4, { width: anchoFoto, align: 'center' });
          }
          doc.rect(x, yFila, anchoFoto, altoFoto).lineWidth(0.5).strokeColor('#B8C4D6').stroke();
          doc
            .fillColor('#333')
            .font(FUENTES.calibri)
            .fontSize(8)
            .text(`${i + j + 1}. ${f.texto || ''}`.trim(), x, yFila + altoFoto + 3, { width: anchoFoto, height: altoTexto - 4, ellipsis: true });
        });
        doc.y = yFila + altoFoto + altoTexto;
      }
      doc.y += 4;
    }

    // ── Firma ──
    if (doc.y + 90 > doc.page.height - doc.page.margins.bottom) doc.addPage();
    doc.y += 10;
    const yFirma = doc.y;
    const es = d.especialista;
    if (d.firmada && es?.FIRMA?.length) {
      try {
        doc.image(es.FIRMA, MARGEN, yFirma, { fit: [160, 50] });
      } catch {
        /* firma inválida */
      }
    }
    doc.y = yFirma + 52;
    doc.moveTo(MARGEN, doc.y).lineTo(MARGEN + 200, doc.y).lineWidth(0.7).strokeColor('#333').stroke();
    doc.y += 3;
    doc.fillColor('black').font(FUENTES.calibriBold).fontSize(9).text(es?.NOMBRE ?? '', MARGEN, doc.y, { width: 260 });
    doc.font(FUENTES.calibri).fontSize(8.5).text([es?.ESPECIALIDAD, es?.REGISTRO_MEDICO ? `Reg. ${es.REGISTRO_MEDICO}` : ''].filter(Boolean).join(' · '), MARGEN, doc.y, { width: 260 });
    doc
      .fillColor(d.firmada ? '#166534' : '#B91C1C')
      .font(FUENTES.calibriBold)
      .fontSize(8.5)
      .text(
        d.firmada
          ? `Firmado${d.fechaFirma ? ` el ${fechaHoraTexto(d.fechaFirma)}` : ''}. Documento inalterable (Resolución 3100 de 2019).`
          : 'BORRADOR: documento sin firmar, no tiene validez clínica.',
        MARGEN,
        doc.y + 2,
        { width: ancho },
      );

    // ── Adendas ──
    if (d.adendas.length) {
      doc.y += 10;
      if (doc.y + 50 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      doc.fillColor(AZUL).font(FUENTES.calibriBold).fontSize(9.5).text('ADENDAS', MARGEN, doc.y);
      doc.y += 3;
      for (const a of d.adendas) {
        doc.fillColor('#555').font(FUENTES.calibri).fontSize(8).text(`${fechaHoraTexto(a.fechaHora)} · ${a.autor ?? ''}`, MARGEN, doc.y, { width: ancho });
        doc.fillColor('black').font(FUENTES.arial).fontSize(9).text(a.texto, MARGEN, doc.y + 1, { width: ancho });
        doc.y += 6;
      }
    }

    // ── Pie con páginas y marca de borrador ──
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i++) {
      doc.switchToPage(rango.start + i);
      if (!d.firmada) {
        doc.save();
        doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
        doc.fillColor('#E11D48').opacity(0.08).font(FUENTES.calibriBold).fontSize(90).text('BORRADOR', 0, doc.page.height / 2 - 50, { width: doc.page.width, align: 'center' });
        doc.restore();
        doc.opacity(1);
      }
      const yPie = doc.page.height - MARGEN;
      doc.fillColor('#777').font(FUENTES.calibri).fontSize(7.5);
      doc.text(`${d.titulo} · Orden ${d.numero} · ${nombre}`, MARGEN, yPie, { width: ancho - 80, lineBreak: false, height: 10 });
      doc.text(`Página ${i + 1} de ${rango.count}`, MARGEN, yPie, { width: ancho, align: 'right', lineBreak: false, height: 10 });
    }

    return pdfABuffer(doc);
  }
}

/** Respuesta HTTP de un PDF (inline o descarga), igual que en patología. */
export function enviarPdf(
  res: { set: (h: Record<string, string>) => unknown; send: (b: Buffer) => unknown },
  buffer: Buffer,
  nombreArchivo: string,
  descargar = false,
) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`,
    'Access-Control-Expose-Headers': 'Content-Disposition',
  });
  res.send(buffer);
}
