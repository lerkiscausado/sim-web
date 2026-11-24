import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { RdaService } from '../interoperabilidad/rda.service';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { HistoriaDiagnosticos } from './entities/historia-diagnosticos.entity';
import { HistoriaMedicamentos } from './entities/historia-medicamentos.entity';
import { HistoriaLaboratorios } from './entities/historia-laboratorios.entity';
import { HistoriaProcedimientos } from './entities/historia-procedimientos.entity';
import { HistoriaRxs } from './entities/historia-rxs.entity';
import { DetalleOrden, EstadoDetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { Antecedentes } from '../pacientes/entities/antecedentes.entity';
import { HistoriaClinicaTrazabilidad, AccionTrazabilidad } from './entities/historia-clinica-trazabilidad.entity';
import { HistoriaClinicaAdenda } from './entities/historia-clinica-adenda.entity';
import { GuardarAntecedentesDto } from './dto/guardar-antecedentes.dto';
import { UpsertHistoriaClinicaDto } from './dto/upsert-historia-clinica.dto';
import {
  AddHistoriaDiagnosticoDto,
  AddHistoriaMedicamentoDto,
  AddHistoriaLaboratorioDto,
  AddHistoriaProcedimientoDto,
  AddHistoriaRxsDto,
} from './dto/add-historia-item.dto';
import { hoyISO } from '../common/registros.util';

/**
 * Tipos de estudio que alimentan la cola de Historia Clínica, réplica exacta
 * de DOrdenes.PacientesHistoriaEndoscopia() (IDs 8, 9 y 13 en tipo_estudio,
 * hardcodeados igual que en el VB.NET original -- son los mismos IDs de la
 * misma base de datos que se está migrando).
 */
const TIPOS_ESTUDIO_HISTORIA = [8, 9, 13];

/**
 * Nombre del tipo de estudio que, en frmHistoria (SIM-ENDOSCOPIA), muestra las
 * pestañas de primera vez (motivo, antecedentes, enfermedad actual, revisión por
 * sistemas). Cualquier otro tipo muestra "Consulta de control / Evolución".
 */
export const ESTUDIO_PRIMERA_VEZ = 'CONSULTA PRIMERA VEZ';

/** Tipo de estudio que el escritorio ignora al decidir si la orden quedó atendida (DDetalleOrden.DetalleOrdenPendiente). */
const TIPO_ESTUDIO_EXCLUIDO_PENDIENTES = 14;

const MENSAJE_FIRMADA =
  'Esta historia clínica ya fue firmada y no se puede modificar (Resolución 3100). Use una adenda para agregar información.';

@Injectable()
export class HistoriaClinicaService {
  constructor(
    @InjectRepository(HistoriaClinica)
    private readonly repo: Repository<HistoriaClinica>,
    @InjectRepository(HistoriaDiagnosticos)
    private readonly diagnosticosRepo: Repository<HistoriaDiagnosticos>,
    @InjectRepository(HistoriaMedicamentos)
    private readonly medicamentosRepo: Repository<HistoriaMedicamentos>,
    @InjectRepository(HistoriaLaboratorios)
    private readonly laboratoriosRepo: Repository<HistoriaLaboratorios>,
    @InjectRepository(HistoriaProcedimientos)
    private readonly procedimientosRepo: Repository<HistoriaProcedimientos>,
    @InjectRepository(HistoriaRxs)
    private readonly rxsRepo: Repository<HistoriaRxs>,
    @InjectRepository(DetalleOrden)
    private readonly detalleOrdenRepo: Repository<DetalleOrden>,
    @InjectRepository(Antecedentes)
    private readonly antecedentesRepo: Repository<Antecedentes>,
    @InjectRepository(HistoriaClinicaTrazabilidad)
    private readonly trazabilidadRepo: Repository<HistoriaClinicaTrazabilidad>,
    @InjectRepository(HistoriaClinicaAdenda)
    private readonly adendasRepo: Repository<HistoriaClinicaAdenda>,
    private readonly dataSource: DataSource,
    private readonly rda: RdaService,
  ) {}

  // ───────────── Resolución 3100: trazabilidad y bloqueo ─────────────

  /** Inserta en la bitácora. Nunca se actualiza ni se borra. */
  private registrar(
    accion: AccionTrazabilidad,
    idOrden: number,
    idHistoria: number | null,
    idUsuario: number | null,
    detalle?: string,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(HistoriaClinicaTrazabilidad) : this.trazabilidadRepo;
    return repo.insert({ accion, idOrden, idHistoria, idUsuario, detalle: detalle?.slice(0, 500) ?? null });
  }

  /**
   * Rechaza cualquier cambio sobre una historia firmada (o cerrada con ESTADO='C',
   * que es como la cerraba la web antes de la 3100) y deja el intento en la
   * bitácora, igual que DHistoriaClinica.Guardar del escritorio.
   */
  private async asegurarEditable(idDetalleOrden: number, idUsuario: number, que: string) {
    const historia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (historia && (historia.firmada || historia.estado === 'C')) {
      await this.registrar('INTENTO_BLOQUEADO', historia.idOrden, historia.id, idUsuario, que);
      throw new ConflictException(MENSAJE_FIRMADA);
    }
    return historia;
  }

  /** Estado de firma de una orden (por id_orden): lo usan antecedentes, que se guardan por orden. */
  private async ordenFirmada(idOrden: number) {
    return this.repo
      .createQueryBuilder('h')
      .where('h.idOrden = :idOrden', { idOrden })
      .andWhere("(h.firmada = 1 OR h.estado = 'C')")
      .getOne();
  }

  /**
   * Cola de trabajo del especialista: sus propios pacientes pendientes de
   * historia clínica. Réplica de PacientesHistoriaEndoscopia(IdEmpleado):
   * tipo_estudio.ID IN (8,9,13), detalle_orden.ESTADO='PENDIENTE',
   * ordenes.ID_EMPLEADO = el especialista logueado (cada médico ve solo
   * su propia cola, no la de todos).
   */
  async findPendientes(idEmpleado: number, q?: string) {
    const qb = this.detalleOrdenRepo
      .createQueryBuilder('d')
      .innerJoin('ordenes', 'o', 'o.ID = CAST(d.ID_ORDEN AS UNSIGNED)')
      .innerJoin('usuarios', 'p', 'p.ID = o.ID_USUARIO')
      .innerJoin('tipo_estudio', 't', 't.ID = d.ID_TIPO_ESTUDIO')
      .select([
        'd.ID AS idDetalleOrden',
        'o.ID AS idOrden',
        'o.CONSECUTIVO AS consecutivo',
        'o.NUMERO_ORDEN AS numeroOrden',
        'o.FECHA_INGRESO AS fechaIngreso',
        'o.ID_USUARIO AS idUsuario',
        't.NOMBRE_TIPO_ESTUDIO AS estudio',
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
      .where('t.ID IN (:...tipos)', { tipos: TIPOS_ESTUDIO_HISTORIA })
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
      estudio: f.estudio,
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

  /** El registro de historia (si existe) para una línea de detalle_orden puntual. */
  findByDetalleOrden(idDetalleOrden: number) {
    return this.repo.findOne({ where: { idDetalleOrden } });
  }

  /**
   * Historias firmadas por el especialista (las más recientes primero), para
   * consultarlas y agregarles adendas. El escritorio de GASTROLAP no tiene esta
   * vista: allí las adendas solo existían en frmHistoriaGL.
   */
  async findFirmadas(idEmpleado: number, q?: string) {
    const params: unknown[] = [idEmpleado, ...TIPOS_ESTUDIO_HISTORIA];
    let filtro = '';
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      filtro =
        ' AND (o.NUMERO_ORDEN LIKE ? OR o.CONSECUTIVO LIKE ? OR p.IDENTIFICACION LIKE ? OR p.PRIMER_NOMBRE LIKE ? OR p.PRIMER_APELLIDO LIKE ?)';
      params.push(term, term, term, term, term);
    }
    const filas = await this.dataSource.query(
      `SELECT h.ID AS idHistoria, d.ID AS idDetalleOrden, o.ID AS idOrden, o.CONSECUTIVO AS consecutivo,
              o.NUMERO_ORDEN AS numeroOrden, o.FECHA_INGRESO AS fechaIngreso, o.ID_USUARIO AS idUsuario,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, h.fecha_firma AS fechaFirma,
              (SELECT COUNT(*) FROM historia_clinica_adendas a WHERE a.id_historia = h.ID) AS adendas,
              p.ID AS pacienteId, p.ID_TIPO_IDENTIFICACION AS idTipoIdentificacion, p.IDENTIFICACION AS identificacion,
              p.PRIMER_NOMBRE AS primerNombre, p.SEGUNDO_NOMBRE AS segundoNombre,
              p.PRIMER_APELLIDO AS primerApellido, p.SEGUNDO_APELLIDO AS segundoApellido,
              p.SEXO AS sexo, p.FECHA_NACIMIENTO AS fechaNacimiento, p.TELEFONO AS telefono,
              p.CORREO_ELECTRONICO AS correoElectronico
       FROM historia_clinica h
       INNER JOIN detalle_orden d ON d.ID = h.ID_DETALLE_ORDEN
       INNER JOIN ordenes o ON o.ID = h.ID_ORDEN
       INNER JOIN usuarios p ON p.ID = o.ID_USUARIO
       INNER JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       WHERE (h.firmada = 1 OR h.ESTADO = 'C') AND o.ID_EMPLEADO = ?
         AND t.ID IN (${TIPOS_ESTUDIO_HISTORIA.map(() => '?').join(',')})${filtro}
       ORDER BY COALESCE(h.fecha_firma, o.FECHA_INGRESO) DESC
       LIMIT 200`,
      params,
    );
    return filas.map((f: any) => ({
      idHistoria: Number(f.idHistoria),
      idDetalleOrden: Number(f.idDetalleOrden),
      idOrden: Number(f.idOrden),
      consecutivo: f.consecutivo,
      numeroOrden: f.numeroOrden,
      fechaIngreso: f.fechaIngreso,
      idUsuario: Number(f.idUsuario),
      estudio: f.estudio,
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

  // ───────────── Antecedentes (tabla `antecedentes`, una fila por orden) ─────────────

  /**
   * Antecedentes de esta orden y el acumulado de las órdenes anteriores del
   * paciente. Réplica de frmHistoria.NuevaHistoria: CargarAntecedentes(orden) y
   * ListarAntecedentes(usuario) (GROUP_CONCAT separado por ". ").
   */
  async antecedentes(idOrden: number, idUsuario: number) {
    const actual = await this.antecedentesRepo.findOne({ where: { idOrden } });
    const [previos] = await this.dataSource.query(
      `SELECT GROUP_CONCAT(DISTINCT NULLIF(TRIM(ANTECEDENTES_FAMILIARES), '') SEPARATOR '. ') AS familiares,
              GROUP_CONCAT(DISTINCT NULLIF(TRIM(ANTECEDENTES_PERSONALES), '') SEPARATOR '. ') AS personales
       FROM antecedentes WHERE ID_USUARIO = ? AND ID_ORDEN <> ?`,
      [idUsuario, idOrden],
    );
    return {
      familiares: actual?.antecedentesFamiliares ?? '',
      personales: actual?.antecedentesPersonales ?? '',
      previosFamiliares: previos?.familiares ?? '',
      previosPersonales: previos?.personales ?? '',
    };
  }

  /** DAntecedentes.Guardar: UPDATE por id_orden si existe, si no INSERT. Bloqueado si la historia de la orden está firmada. */
  async guardarAntecedentes(dto: GuardarAntecedentesDto, idUsuarioSistema: number) {
    const firmada = await this.ordenFirmada(dto.idOrden);
    if (firmada) {
      await this.registrar('INTENTO_BLOQUEADO', firmada.idOrden, firmada.id, idUsuarioSistema, 'Modificar antecedentes');
      throw new ConflictException(MENSAJE_FIRMADA);
    }
    await this.antecedentesRepo.save({
      idOrden: dto.idOrden,
      idUsuario: dto.idUsuario,
      antecedentesFamiliares: dto.familiares ?? '',
      antecedentesPersonales: dto.personales ?? '',
    });
    return this.antecedentes(dto.idOrden, dto.idUsuario);
  }

  /** Historial de historias clínicas anteriores del paciente (ya cerradas), del más reciente al más antiguo. */
  async estudiosAnteriores(idUsuario: number) {
    return this.dataSource.query(
      `SELECT h.ID AS id, h.ID_ORDEN AS idOrden, o.CONSECUTIVO AS consecutivo,
              o.NUMERO_ORDEN AS numeroOrden, o.FECHA_INGRESO AS fechaIngreso,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, h.DIAGNOSTICO AS diagnostico,
              h.MOTIVO_CONSULTA AS motivoConsulta
       FROM historia_clinica h
       INNER JOIN ordenes o ON o.ID = h.ID_ORDEN
       LEFT JOIN detalle_orden d ON d.ID = h.ID_DETALLE_ORDEN
       LEFT JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       WHERE o.ID_USUARIO = ? AND h.ESTADO = 'C'
       ORDER BY o.FECHA_INGRESO DESC`,
      [idUsuario],
    );
  }

  async upsert(dto: UpsertHistoriaClinicaDto, idEspecialista: number): Promise<HistoriaClinica> {
    const { idOrden, idDetalleOrden, ...recibidos } = dto;
    // Los campos que no vienen en la petición no deben pisar los valores por defecto con NULL.
    const campos = Object.fromEntries(
      Object.entries(recibidos).filter(([, v]) => v !== undefined),
    ) as typeof recibidos;
    let historia = await this.asegurarEditable(idDetalleOrden, idEspecialista, 'Guardar historia');
    const nueva = !historia;

    if (historia) {
      Object.assign(historia, campos, { idEspecialista });
    } else {
      historia = this.repo.create({
        idOrden,
        idDetalleOrden,
        fechaHistoria: hoyISO(),
        idEspecialista,
        estado: 'A',
        firmada: false,
        // Igual que GuardarHistoria del escritorio: Tanner no aplica en GASTROLAP.
        tannerA: '-',
        tannerB: '-',
        tannerP: '-',
        tannerVt: '-',
        ...campos,
      } as Partial<HistoriaClinica>);
    }
    const guardada = await this.repo.save(historia);
    await this.registrar(nueva ? 'CREACION' : 'ACTUALIZACION', guardada.idOrden, guardada.id, idEspecialista);
    return guardada;
  }

  /**
   * Validaciones de bbiGuardar (chkProcesado) en frmHistoria de SIM-ENDOSCOPIA.
   * Devuelve la lista de faltantes; vacía = lista para firmar.
   */
  async faltantesParaFirmar(idDetalleOrden: number): Promise<string[]> {
    const historia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!historia) return ['Guardar la historia'];
    const [tipo] = await this.dataSource.query(
      `SELECT t.NOMBRE_TIPO_ESTUDIO AS estudio FROM detalle_orden d
       INNER JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO WHERE d.ID = ?`,
      [idDetalleOrden],
    );
    const primeraVez = (tipo?.estudio ?? '').trim().toUpperCase() === ESTUDIO_PRIMERA_VEZ;
    const vacio = (v?: string | null) => !v || !v.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    const faltan: string[] = [];
    if (primeraVez) {
      if (vacio(historia.motivoConsulta)) faltan.push('Motivo de consulta');
      const ant = await this.antecedentesRepo.findOne({ where: { idOrden: historia.idOrden } });
      if (vacio(ant?.antecedentesFamiliares)) faltan.push('Antecedentes familiares');
      if (vacio(ant?.antecedentesPersonales)) faltan.push('Antecedentes personales');
    } else if (vacio(historia.consultaControl)) {
      faltan.push('Evolución (consulta de control)');
    }
    const [{ n }] = await this.dataSource.query(
      'SELECT COUNT(*) AS n FROM historia_diagnosticos WHERE ID_DETALLE_ORDEN = ?',
      [idDetalleOrden],
    );
    if (Number(n) === 0) faltan.push('Al menos un diagnóstico CIE-10');
    return faltan;
  }

  /**
   * Firma la historia (Resolución 3100). Réplica del flujo de frmHistoria:
   * valida, pone el primer CIE-10 en detalle_orden.DIAGNOSTICO1 y lo pasa a
   * ATENDIDO, cierra la orden si no quedan detalles pendientes y marca la
   * historia como firmada con la hora del servidor. Todo en una transacción.
   */
  async firmar(idDetalleOrden: number, idEmpleado: number) {
    const historia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!historia) throw new NotFoundException('No hay historia clínica registrada para esta línea de orden');
    if (historia.firmada || historia.estado === 'C') {
      await this.registrar('INTENTO_BLOQUEADO', historia.idOrden, historia.id, idEmpleado, 'Firmar de nuevo');
      throw new ConflictException('Esta historia clínica ya fue firmada.');
    }
    const faltan = await this.faltantesParaFirmar(idDetalleOrden);
    if (faltan.length) throw new BadRequestException(`No se puede firmar. Falta: ${faltan.join(', ')}.`);

    await this.dataSource.transaction(async (m) => {
      const [primerDx] = await m.query(
        'SELECT ID_DIAGNOSTICO AS codigo FROM historia_diagnosticos WHERE ID_DETALLE_ORDEN = ? ORDER BY createdAt ASC LIMIT 1',
        [idDetalleOrden],
      );
      await m.query("UPDATE detalle_orden SET DIAGNOSTICO1 = ?, ESTADO = 'ATENDIDO' WHERE ID = ?", [
        primerDx.codigo,
        idDetalleOrden,
      ]);
      const [{ pendientes }] = await m.query(
        `SELECT COUNT(*) AS pendientes FROM detalle_orden
         WHERE ID_ORDEN = ? AND ESTADO = 'PENDIENTE' AND ID_TIPO_ESTUDIO <> ?`,
        [String(historia.idOrden), TIPO_ESTUDIO_EXCLUIDO_PENDIENTES],
      );
      if (Number(pendientes) === 0) {
        await m.query("UPDATE ordenes SET ESTADO = 'ATENDIDO' WHERE ID = ?", [historia.idOrden]);
      }
      // fecha_firma = NOW() del servidor de BD, como MarcarFirmada del escritorio.
      await m.query(
        "UPDATE historia_clinica SET firmada = 1, fecha_firma = NOW(), usuario_firma = ?, ESTADO = 'C' WHERE ID = ?",
        [idEmpleado, historia.id],
      );
      await this.registrar('FIRMA', historia.idOrden, historia.id, idEmpleado, undefined, m);
    });

    // RDA (MinSalud) en segundo plano: nunca bloquea ni deshace la firma.
    const [orden] = await this.dataSource.query('SELECT ID_USUARIO AS idUsuario FROM ordenes WHERE ID = ?', [historia.idOrden]);
    if (orden) {
      this.rda.enviarTrasFirma({
        idOrden: historia.idOrden,
        idUsuario: Number(orden.idUsuario),
        idEspecialista: idEmpleado,
        idDetalleOrden,
        tipo: 'C',
      });
    }
    return this.repo.findOne({ where: { id: historia.id } });
  }

  // ───────────── Adendas ─────────────

  listAdendas(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT a.id, a.texto, a.fecha_hora AS fechaHora, a.id_usuario AS idUsuario, e.NOMBRE AS autor
       FROM historia_clinica_adendas a
       INNER JOIN historia_clinica h ON h.ID = a.id_historia
       LEFT JOIN especialistas e ON e.ID_ESPECIALISTA = a.id_usuario
       WHERE h.ID_DETALLE_ORDEN = ?
       ORDER BY a.fecha_hora ASC, a.id ASC`,
      [idDetalleOrden],
    );
  }

  /** Solo sobre historias firmadas: lo que no esté firmado se corrige editando. */
  async addAdenda(idDetalleOrden: number, texto: string, idEmpleado: number) {
    const historia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!historia) throw new NotFoundException('No hay historia clínica registrada para esta línea de orden');
    if (!historia.firmada && historia.estado !== 'C') {
      throw new BadRequestException('La historia aún no está firmada: corrija el texto directamente.');
    }
    const limpio = texto?.trim();
    if (!limpio) throw new BadRequestException('El texto de la adenda es obligatorio.');
    await this.dataSource.transaction(async (m) => {
      await m.getRepository(HistoriaClinicaAdenda).insert({
        idOrden: historia.idOrden,
        idHistoria: historia.id,
        idUsuario: idEmpleado,
        texto: limpio,
      });
      await this.registrar('ADENDA', historia.idOrden, historia.id, idEmpleado, limpio.slice(0, 200), m);
    });
    return this.listAdendas(idDetalleOrden);
  }

  listTrazabilidad(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT t.id, t.accion, t.detalle, t.fecha_hora AS fechaHora, t.id_usuario AS idUsuario, e.NOMBRE AS usuario
       FROM historia_clinica_trazabilidad t
       INNER JOIN historia_clinica h ON h.ID = t.id_historia
       LEFT JOIN especialistas e ON e.ID_ESPECIALISTA = t.id_usuario
       WHERE h.ID_DETALLE_ORDEN = ?
       ORDER BY t.fecha_hora ASC, t.id ASC`,
      [idDetalleOrden],
    );
  }

  // ---- Diagnósticos ----
  listDiagnosticos(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT hd.ID_DIAGNOSTICO AS idDiagnostico, hd.DESCRIPCION AS descripcion, dg.NOMBRE_DIAGNOSTICO AS nombre
       FROM historia_diagnosticos hd
       LEFT JOIN diagnosticos dg ON dg.CODIGO_DIAGNOSTICO = hd.ID_DIAGNOSTICO
       WHERE hd.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
  }

  async addDiagnostico(dto: AddHistoriaDiagnosticoDto, idUsuario: number) {
    await this.asegurarEditable(dto.idDetalleOrden, idUsuario, 'Agregar diagnostico');
    const fila = this.diagnosticosRepo.create(dto as Partial<HistoriaDiagnosticos>);
    return this.diagnosticosRepo.save(fila);
  }

  async removeDiagnostico(idDetalleOrden: number, idOrden: number, idDiagnostico: string, idUsuario: number) {
    await this.asegurarEditable(idDetalleOrden, idUsuario, 'Quitar diagnostico');
    return this.diagnosticosRepo.delete({ idDetalleOrden, idOrden, idDiagnostico });
  }

  // ---- Medicamentos ----
  listMedicamentos(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT hm.ID_MEDICAMENTO AS idMedicamento, hm.ID_VIA_ADMINISTRACION AS idViaAdministracion,
              hm.DOSIS AS dosis, hm.CANTIDAD AS cantidad, hm.DESCRIPCION AS descripcion,
              m.NOMBRE AS nombreMedicamento, v.NOMBRE AS nombreViaAdministracion
       FROM historia_medicamentos hm
       LEFT JOIN medicamentos m ON m.ID = hm.ID_MEDICAMENTO
       LEFT JOIN via_administracion v ON v.ID = hm.ID_VIA_ADMINISTRACION
       WHERE hm.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
  }

  async addMedicamento(dto: AddHistoriaMedicamentoDto, idUsuario: number) {
    await this.asegurarEditable(dto.idDetalleOrden, idUsuario, 'Agregar medicamento');
    const fila = this.medicamentosRepo.create(dto as Partial<HistoriaMedicamentos>);
    return this.medicamentosRepo.save(fila);
  }

  async removeMedicamento(idDetalleOrden: number, idOrden: number, idMedicamento: number, idUsuario: number) {
    await this.asegurarEditable(idDetalleOrden, idUsuario, 'Quitar medicamento');
    return this.medicamentosRepo.delete({ idDetalleOrden, idOrden, idMedicamento });
  }

  // ---- Laboratorios (referencian CUPS) ----
  listLaboratorios(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT hl.ID_LABORATORIO AS codigoCups, hl.DESCRIPCION AS descripcion, c.NOMBRE_CUPS AS nombre
       FROM historia_laboratorios hl
       LEFT JOIN cups c ON c.CODIGO_CUPS = hl.ID_LABORATORIO
       WHERE hl.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
  }

  async addLaboratorio(dto: AddHistoriaLaboratorioDto, idUsuario: number) {
    await this.asegurarEditable(dto.idDetalleOrden, idUsuario, 'Agregar laboratorio');
    const fila = this.laboratoriosRepo.create({
      idOrden: dto.idOrden,
      idDetalleOrden: dto.idDetalleOrden,
      idLaboratorio: Number(dto.codigoCups),
      descripcion: dto.descripcion,
    } as Partial<HistoriaLaboratorios>);
    return this.laboratoriosRepo.save(fila);
  }

  async removeLaboratorio(idDetalleOrden: number, idOrden: number, codigoCups: string, idUsuario: number) {
    await this.asegurarEditable(idDetalleOrden, idUsuario, 'Quitar laboratorio');
    return this.laboratoriosRepo.delete({ idDetalleOrden, idOrden, idLaboratorio: Number(codigoCups) });
  }

  // ---- Procedimientos (referencian CUPS) ----
  listProcedimientos(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT hp.ID_PROCEDIMIENTO AS codigoCups, hp.DESCRIPCION AS descripcion, c.NOMBRE_CUPS AS nombre
       FROM historia_procedimientos hp
       LEFT JOIN cups c ON c.CODIGO_CUPS = hp.ID_PROCEDIMIENTO
       WHERE hp.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
  }

  async addProcedimiento(dto: AddHistoriaProcedimientoDto, idUsuario: number) {
    await this.asegurarEditable(dto.idDetalleOrden, idUsuario, 'Agregar procedimiento');
    const fila = this.procedimientosRepo.create({
      idOrden: dto.idOrden,
      idDetalleOrden: dto.idDetalleOrden,
      idProcedimiento: Number(dto.codigoCups),
      descripcion: dto.descripcion,
    } as Partial<HistoriaProcedimientos>);
    return this.procedimientosRepo.save(fila);
  }

  async removeProcedimiento(idDetalleOrden: number, idOrden: number, codigoCups: string, idUsuario: number) {
    await this.asegurarEditable(idDetalleOrden, idUsuario, 'Quitar procedimiento');
    return this.procedimientosRepo.delete({ idDetalleOrden, idOrden, idProcedimiento: Number(codigoCups) });
  }

  // ---- Revisión por sistemas ----
  listRxs(idDetalleOrden: number) {
    return this.dataSource.query(
      `SELECT hr.ID_RXS AS idRxs, hr.DESCRIPCION AS descripcion, r.NOMBRE AS nombre
       FROM historia_rxs hr
       LEFT JOIN revision_sistemas r ON r.ID = hr.ID_RXS
       WHERE hr.ID_DETALLE_ORDEN = ?`,
      [idDetalleOrden],
    );
  }

  async addRxs(dto: AddHistoriaRxsDto, idUsuario: number) {
    await this.asegurarEditable(dto.idDetalleOrden, idUsuario, 'Agregar rxs');
    const fila = this.rxsRepo.create(dto as Partial<HistoriaRxs>);
    return this.rxsRepo.save(fila);
  }

  async removeRxs(idDetalleOrden: number, idOrden: number, idRxs: number, idUsuario: number) {
    await this.asegurarEditable(idDetalleOrden, idUsuario, 'Quitar rxs');
    return this.rxsRepo.delete({ idDetalleOrden, idOrden, idRxs });
  }
}
