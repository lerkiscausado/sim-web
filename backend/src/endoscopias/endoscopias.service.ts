import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { RdaService } from '../interoperabilidad/rda.service';
import { Endoscopias } from '../atenciones/entities/endoscopias.entity';
import { DetalleOrden, EstadoDetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { UpsertEndoscopiaDto } from './dto/upsert-endoscopia.dto';
import { EndoscopiaTrazabilidad } from './entities/endoscopia-trazabilidad.entity';
import { EndoscopiaAdenda } from './entities/endoscopia-adenda.entity';
import type { AccionTrazabilidad } from '../historia-clinica/entities/historia-clinica-trazabilidad.entity';

/**
 * Tipos de estudio que alimentan la cola de Endoscopias, réplica exacta de
 * DOrdenes.PacientesEstudioEndoscopia() (IDs 10, 11 y 12 en tipo_estudio,
 * hardcodeados igual que el VB.NET original -- misma base de datos que se
 * está migrando).
 */
const TIPOS_ESTUDIO_ENDOSCOPIA = [10, 11, 12];

/** Tipo de estudio que el escritorio ignora al decidir si la orden quedó atendida (DDetalleOrden.DetalleOrdenPendiente). */
const TIPO_ESTUDIO_EXCLUIDO_PENDIENTES = 14;

const MENSAJE_FIRMADO =
  'Este estudio ya fue firmado y no se puede modificar (Resolución 3100). Use una adenda para agregar información.';

/**
 * Pestañas del informe según el tipo de estudio, como Nuevo() de frmEndoscopiaGL:
 * CAMPO2-CAMPO4 cambian de nombre; CAMPO5 (ELCB) solo existe en colonoscopia.
 */
export function pestanasPorEstudio(estudio?: string | null) {
  const t = (estudio ?? '').toUpperCase();
  if (t.includes('COLONOSCOPIA')) return { campo2: 'Inspección', campo3: 'Tacto', campo4: 'Colonoscopia', elcb: true };
  if (t.includes('RECTOSCOPIA')) return { campo2: 'Inspección', campo3: 'Tacto', campo4: 'Rectoscopia', elcb: false };
  return { campo2: 'Esófago', campo3: 'Estómago', campo4: 'Duodeno', elcb: false };
}

const textoVacio = (v?: string | null) => !v || !v.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

@Injectable()
export class EndoscopiasService {
  constructor(
    @InjectRepository(Endoscopias)
    private readonly repo: Repository<Endoscopias>,
    @InjectRepository(DetalleOrden)
    private readonly detalleOrdenRepo: Repository<DetalleOrden>,
    @InjectRepository(EndoscopiaTrazabilidad)
    private readonly trazabilidadRepo: Repository<EndoscopiaTrazabilidad>,
    private readonly dataSource: DataSource,
    private readonly rda: RdaService,
  ) {}

  private registrar(
    accion: AccionTrazabilidad,
    idOrden: number,
    idEndoscopia: number | null,
    idUsuario: number | null,
    detalle?: string,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(EndoscopiaTrazabilidad) : this.trazabilidadRepo;
    return repo.insert({ accion, idOrden, idEndoscopia, idUsuario, detalle: detalle?.slice(0, 500) ?? null });
  }

  /**
   * Cola de trabajo del especialista: réplica de PacientesEstudioEndoscopia
   * (IdEspecialista) -- tipo_estudio.ID IN (10,11,12), detalle_orden.ESTADO
   * ='PENDIENTE', ordenes.ID_EMPLEADO = el especialista logueado. Se agrega
   * el nombre del CUPS y del tipo de estudio (usados en el frontend para
   * precargar la plantilla del reporte según el tipo de procedimiento,
   * igual que hace frmEndoscopia.vb).
   */
  async findPendientes(idEmpleado: number, q?: string) {
    const qb = this.detalleOrdenRepo
      .createQueryBuilder('d')
      .innerJoin('ordenes', 'o', 'o.ID = CAST(d.ID_ORDEN AS UNSIGNED)')
      .innerJoin('usuarios', 'p', 'p.ID = o.ID_USUARIO')
      .innerJoin('tipo_estudio', 't', 't.ID = d.ID_TIPO_ESTUDIO')
      .innerJoin('cups', 'c', 'c.CODIGO_CUPS = d.CODIGO_CUPS')
      .select([
        'd.ID AS idDetalleOrden',
        'o.ID AS idOrden',
        'o.CONSECUTIVO AS consecutivo',
        'o.NUMERO_ORDEN AS numeroOrden',
        'o.FECHA_INGRESO AS fechaIngreso',
        'o.ID_USUARIO AS idUsuario',
        't.ID AS idTipoEstudio',
        't.NOMBRE_TIPO_ESTUDIO AS estudio',
        'c.NOMBRE_CUPS AS nombreCups',
        'p.ID_TIPO_IDENTIFICACION AS idTipoIdentificacion',
        'p.IDENTIFICACION AS identificacion',
        'p.PRIMER_NOMBRE AS primerNombre',
        'p.SEGUNDO_NOMBRE AS segundoNombre',
        'p.PRIMER_APELLIDO AS primerApellido',
        'p.SEGUNDO_APELLIDO AS segundoApellido',
        'p.SEXO AS sexo',
        'p.FECHA_NACIMIENTO AS fechaNacimiento',
        'p.TELEFONO AS telefono',
        'p.CORREO_ELECTRONICO AS correoElectronico',
        'p.ID AS pacienteId',
      ])
      .where('t.ID IN (:...tipos)', { tipos: TIPOS_ESTUDIO_ENDOSCOPIA })
      .andWhere('d.ESTADO = :estado', { estado: EstadoDetalleOrden.PENDIENTE })
      .andWhere('o.ID_EMPLEADO = :idEmpleado', { idEmpleado });

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(o.NUMERO_ORDEN LIKE :term OR o.CONSECUTIVO LIKE :term OR p.IDENTIFICACION LIKE :term ' +
          'OR p.PRIMER_NOMBRE LIKE :term OR p.PRIMER_APELLIDO LIKE :term)',
        { term },
      );
    }

    const filas = await qb.orderBy('o.FECHA_INGRESO', 'ASC').getRawMany();

    return filas.map((f) => ({
      idDetalleOrden: Number(f.idDetalleOrden),
      idOrden: Number(f.idOrden),
      consecutivo: f.consecutivo,
      numeroOrden: f.numeroOrden,
      fechaIngreso: f.fechaIngreso,
      idUsuario: Number(f.idUsuario),
      idTipoEstudio: Number(f.idTipoEstudio),
      estudio: f.estudio,
      nombreCups: f.nombreCups,
      paciente: {
        id: f.pacienteId,
        idTipoIdentificacion: f.idTipoIdentificacion,
        identificacion: f.identificacion,
        primerNombre: f.primerNombre,
        segundoNombre: f.segundoNombre,
        primerApellido: f.primerApellido,
        segundoApellido: f.segundoApellido,
        sexo: f.sexo,
        fechaNacimiento: f.fechaNacimiento,
        telefono: f.telefono,
        correoElectronico: f.correoElectronico,
      },
    }));
  }

  findByDetalleOrden(idDetalleOrden: number) {
    return this.repo.findOne({ where: { idDetalleOrden } });
  }

  /** Historial de endoscopias anteriores del paciente (ya atendidas), del más reciente al más antiguo. */
  async estudiosAnteriores(idUsuario: number) {
    return this.dataSource.query(
      `SELECT e.ID AS id, e.ID_ORDEN AS idOrden, o.CONSECUTIVO AS consecutivo,
              o.NUMERO_ORDEN AS numeroOrden, o.FECHA_INGRESO AS fechaIngreso,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, e.CAMPO1 AS campo1, e.DIAGNOSTICO AS diagnostico
       FROM endoscopias e
       INNER JOIN ordenes o ON o.ID = e.ID_ORDEN
       LEFT JOIN detalle_orden d ON d.ID = e.ID_DETALLE_ORDEN
       LEFT JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       WHERE o.ID_USUARIO = ?
       ORDER BY o.FECHA_INGRESO DESC`,
      [idUsuario],
    );
  }

  /**
   * Estudios firmados por el especialista, para consultarlos y agregar adendas.
   * Misma forma que la cola de pendientes.
   */
  async findFirmadas(idEmpleado: number, q?: string) {
    const params: unknown[] = [idEmpleado, ...TIPOS_ESTUDIO_ENDOSCOPIA];
    let filtro = '';
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      filtro =
        ' AND (o.NUMERO_ORDEN LIKE ? OR o.CONSECUTIVO LIKE ? OR p.IDENTIFICACION LIKE ? OR p.PRIMER_NOMBRE LIKE ? OR p.PRIMER_APELLIDO LIKE ?)';
      params.push(term, term, term, term, term);
    }
    const filas = await this.dataSource.query(
      `SELECT e.ID AS idEndoscopia, d.ID AS idDetalleOrden, o.ID AS idOrden, o.CONSECUTIVO AS consecutivo,
              o.NUMERO_ORDEN AS numeroOrden, o.FECHA_INGRESO AS fechaIngreso, o.ID_USUARIO AS idUsuario,
              t.ID AS idTipoEstudio, t.NOMBRE_TIPO_ESTUDIO AS estudio, c.NOMBRE_CUPS AS nombreCups,
              e.fecha_firma AS fechaFirma,
              (SELECT COUNT(*) FROM endoscopias_adendas a WHERE a.id_endoscopia = e.ID) AS adendas,
              p.ID AS pacienteId, p.ID_TIPO_IDENTIFICACION AS idTipoIdentificacion, p.IDENTIFICACION AS identificacion,
              p.PRIMER_NOMBRE AS primerNombre, p.SEGUNDO_NOMBRE AS segundoNombre,
              p.PRIMER_APELLIDO AS primerApellido, p.SEGUNDO_APELLIDO AS segundoApellido,
              p.SEXO AS sexo, p.FECHA_NACIMIENTO AS fechaNacimiento, p.TELEFONO AS telefono,
              p.CORREO_ELECTRONICO AS correoElectronico
       FROM endoscopias e
       INNER JOIN detalle_orden d ON d.ID = e.ID_DETALLE_ORDEN
       INNER JOIN ordenes o ON o.ID = e.ID_ORDEN
       INNER JOIN usuarios p ON p.ID = o.ID_USUARIO
       INNER JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       LEFT JOIN cups c ON c.CODIGO_CUPS = d.CODIGO_CUPS
       WHERE e.firmada = 1 AND o.ID_EMPLEADO = ?
         AND t.ID IN (${TIPOS_ESTUDIO_ENDOSCOPIA.map(() => '?').join(',')})${filtro}
       ORDER BY COALESCE(e.fecha_firma, o.FECHA_INGRESO) DESC
       LIMIT 200`,
      params,
    );
    return filas.map((f: any) => ({
      idEndoscopia: Number(f.idEndoscopia),
      idDetalleOrden: Number(f.idDetalleOrden),
      idOrden: Number(f.idOrden),
      consecutivo: f.consecutivo,
      numeroOrden: f.numeroOrden,
      fechaIngreso: f.fechaIngreso,
      idUsuario: Number(f.idUsuario),
      idTipoEstudio: Number(f.idTipoEstudio),
      estudio: f.estudio,
      nombreCups: f.nombreCups,
      fechaFirma: f.fechaFirma,
      adendas: Number(f.adendas),
      paciente: {
        id: f.pacienteId,
        idTipoIdentificacion: f.idTipoIdentificacion,
        identificacion: f.identificacion,
        primerNombre: f.primerNombre,
        segundoNombre: f.segundoNombre,
        primerApellido: f.primerApellido,
        segundoApellido: f.segundoApellido,
        sexo: f.sexo,
        fechaNacimiento: f.fechaNacimiento,
        telefono: f.telefono,
        correoElectronico: f.correoElectronico,
      },
    }));
  }

  /**
   * Plantilla del especialista para el tipo de estudio (plantillas_informes), con el
   * mismo reparto de columnas que bbiAplicarPlantilla de frmEndoscopiaGL:
   * CAMPO1→ELCB, CAMPO2→descripción, CAMPO3-5→pestañas, CAMPO6→diagnóstico.
   */
  async plantilla(idEmpleado: number, idTipoEstudio: number) {
    const [p] = await this.dataSource.query(
      `SELECT CAMPO1 AS c1, CAMPO2 AS c2, CAMPO3 AS c3, CAMPO4 AS c4, CAMPO5 AS c5, CAMPO6 AS c6
       FROM plantillas_informes WHERE ID_ESPECIALISTA = ? AND ID_TIPO_ESTUDIO = ?
       ORDER BY ID DESC LIMIT 1`,
      [idEmpleado, idTipoEstudio],
    );
    if (!p) return null;
    return { campo5: p.c1 ?? '', campo1: p.c2 ?? '', campo2: p.c3 ?? '', campo3: p.c4 ?? '', campo4: p.c5 ?? '', diagnostico: p.c6 ?? '' };
  }

  async upsert(dto: UpsertEndoscopiaDto, idEmpleado: number): Promise<Endoscopias> {
    const { idOrden, idDetalleOrden, ...recibidos } = dto;
    // Los campos que no vienen en la petición no deben pisar los valores por defecto con NULL.
    const campos = Object.fromEntries(
      Object.entries(recibidos).filter(([, v]) => v !== undefined),
    ) as typeof recibidos;
    // GuardarEndoscopia del escritorio usa la misma fecha para estudio y salida.
    if (!campos.fechaSalida) campos.fechaSalida = campos.fechaEstudio;
    let endoscopia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (endoscopia?.firmada) {
      await this.registrar('INTENTO_BLOQUEADO', endoscopia.idOrden, endoscopia.id, idEmpleado, 'Guardar estudio');
      throw new ConflictException(MENSAJE_FIRMADO);
    }
    const nueva = !endoscopia;

    if (endoscopia) {
      Object.assign(endoscopia, campos, { idEmpleado });
    } else {
      endoscopia = this.repo.create({
        idOrden,
        idDetalleOrden,
        hora: new Date().toTimeString().slice(0, 8),
        idEmpleado,
        campo2: '',
        campo3: '',
        campo4: '',
        campo5: '.',
        tomaBiopsia: 'NO',
        biopsia: '',
        firmada: false,
        ...campos,
      } as Partial<Endoscopias>);
    }
    const guardada = await this.repo.save(endoscopia);
    await this.registrar(nueva ? 'CREACION' : 'ACTUALIZACION', guardada.idOrden, guardada.id, idEmpleado);
    return guardada;
  }

  /** Validaciones de bbiGuardar (chkProcesado) de frmEndoscopiaGL. Vacío = listo para firmar. */
  async faltantesParaFirmar(idDetalleOrden: number): Promise<string[]> {
    const e = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!e) return ['Guardar el estudio'];
    const [tipo] = await this.dataSource.query(
      `SELECT t.NOMBRE_TIPO_ESTUDIO AS estudio FROM detalle_orden d
       INNER JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO WHERE d.ID = ?`,
      [idDetalleOrden],
    );
    const pest = pestanasPorEstudio(tipo?.estudio);
    const faltan: string[] = [];
    if (textoVacio(e.medicoSolicita)) faltan.push('Médico que solicita');
    if (textoVacio(e.indicacion)) faltan.push('Indicación');
    if (textoVacio(e.campo1)) faltan.push('Descripción');
    if (textoVacio(e.campo2)) faltan.push(pest.campo2);
    if (textoVacio(e.campo3)) faltan.push(pest.campo3);
    if (textoVacio(e.campo4)) faltan.push(pest.campo4);
    if (textoVacio(e.diagnostico)) faltan.push('Diagnóstico');
    if (!e.idEquipo) faltan.push('Equipo');
    if (textoVacio(e.codigoDiagnostico)) faltan.push('Código CIE-10');
    if (e.tomaBiopsia === 'SI' && textoVacio(e.biopsia)) faltan.push('Descripción de la biopsia');
    if (e.tomaBiopsia !== 'SI' && !textoVacio(e.biopsia)) {
      faltan.push('Toma de biopsia en SI (hay una descripción de biopsia escrita)');
    }
    return faltan;
  }

  /**
   * Firma el estudio. Réplica de frmEndoscopiaGL: valida, pone el CIE-10 en
   * detalle_orden.DIAGNOSTICO1 y lo pasa a ATENDIDO, cierra la orden si no quedan
   * pendientes y (novedad de la web) marca el estudio como firmado (Res. 3100).
   */
  async firmar(idDetalleOrden: number, idEmpleado: number) {
    const e = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!e) throw new NotFoundException('No hay reporte de endoscopia registrado para esta línea de orden');
    if (e.firmada) {
      await this.registrar('INTENTO_BLOQUEADO', e.idOrden, e.id, idEmpleado, 'Firmar de nuevo');
      throw new ConflictException('Este estudio ya fue firmado.');
    }
    const faltan = await this.faltantesParaFirmar(idDetalleOrden);
    if (faltan.length) throw new BadRequestException(`No se puede firmar. Falta: ${faltan.join(', ')}.`);

    await this.dataSource.transaction(async (m) => {
      await m.query("UPDATE detalle_orden SET DIAGNOSTICO1 = ?, ESTADO = 'ATENDIDO' WHERE ID = ?", [
        e.codigoDiagnostico,
        idDetalleOrden,
      ]);
      const [{ pendientes }] = await m.query(
        `SELECT COUNT(*) AS pendientes FROM detalle_orden
         WHERE ID_ORDEN = ? AND ESTADO = 'PENDIENTE' AND ID_TIPO_ESTUDIO <> ?`,
        [String(e.idOrden), TIPO_ESTUDIO_EXCLUIDO_PENDIENTES],
      );
      if (Number(pendientes) === 0) {
        await m.query("UPDATE ordenes SET ESTADO = 'ATENDIDO' WHERE ID = ?", [e.idOrden]);
      }
      await m.query('UPDATE endoscopias SET firmada = 1, fecha_firma = NOW(), usuario_firma = ? WHERE ID = ?', [
        idEmpleado,
        e.id,
      ]);
      await this.registrar('FIRMA', e.idOrden, e.id, idEmpleado, undefined, m);
    });

    // RDA (MinSalud) en segundo plano: nunca bloquea ni deshace la firma.
    const [orden] = await this.dataSource.query('SELECT ID_USUARIO AS idUsuario FROM ordenes WHERE ID = ?', [e.idOrden]);
    if (orden) {
      this.rda.enviarTrasFirma({
        idOrden: e.idOrden,
        idUsuario: Number(orden.idUsuario),
        idEspecialista: idEmpleado,
        idDetalleOrden,
        tipo: 'P',
      });
    }
    return this.repo.findOne({ where: { id: e.id } });
  }

  listAdendas(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT a.id, a.texto, a.fecha_hora AS fechaHora, a.id_usuario AS idUsuario, s.NOMBRE AS autor
       FROM endoscopias_adendas a
       INNER JOIN endoscopias e ON e.ID = a.id_endoscopia
       LEFT JOIN especialistas s ON s.ID_ESPECIALISTA = a.id_usuario
       WHERE e.ID_DETALLE_ORDEN = ?
       ORDER BY a.fecha_hora ASC, a.id ASC`,
      [idDetalleOrden],
    );
  }

  async addAdenda(idDetalleOrden: number, texto: string, idEmpleado: number) {
    const e = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!e) throw new NotFoundException('No hay reporte de endoscopia registrado para esta línea de orden');
    if (!e.firmada) throw new BadRequestException('El estudio aún no está firmado: corrija el texto directamente.');
    const limpio = texto?.trim();
    if (!limpio) throw new BadRequestException('El texto de la adenda es obligatorio.');
    await this.dataSource.transaction(async (m) => {
      await m.getRepository(EndoscopiaAdenda).insert({ idOrden: e.idOrden, idEndoscopia: e.id, idUsuario: idEmpleado, texto: limpio });
      await this.registrar('ADENDA', e.idOrden, e.id, idEmpleado, limpio.slice(0, 200), m);
    });
    return this.listAdendas(idDetalleOrden);
  }
}
