import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { HistoriaDiagnosticos } from './entities/historia-diagnosticos.entity';
import { HistoriaMedicamentos } from './entities/historia-medicamentos.entity';
import { HistoriaLaboratorios } from './entities/historia-laboratorios.entity';
import { HistoriaProcedimientos } from './entities/historia-procedimientos.entity';
import { HistoriaRxs } from './entities/historia-rxs.entity';
import { DetalleOrden, EstadoDetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { UpsertHistoriaClinicaDto } from './dto/upsert-historia-clinica.dto';
import {
  AddHistoriaDiagnosticoDto,
  AddHistoriaMedicamentoDto,
  AddHistoriaLaboratorioDto,
  AddHistoriaProcedimientoDto,
  AddHistoriaRxsDto,
} from './dto/add-historia-item.dto';

/**
 * Tipos de estudio que alimentan la cola de Historia Clínica, réplica exacta
 * de DOrdenes.PacientesHistoriaEndoscopia() (IDs 8, 9 y 13 en tipo_estudio,
 * hardcodeados igual que en el VB.NET original -- son los mismos IDs de la
 * misma base de datos que se está migrando).
 */
const TIPOS_ESTUDIO_HISTORIA = [8, 9, 13];

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
    private readonly dataSource: DataSource,
  ) {}

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
      idDetalleOrden: f.idDetalleOrden,
      idOrden: f.idOrden,
      consecutivo: f.consecutivo,
      numeroOrden: f.numeroOrden,
      fechaIngreso: f.fechaIngreso,
      idUsuario: f.idUsuario,
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
    const { idOrden, idDetalleOrden, ...campos } = dto;
    let historia = await this.repo.findOne({ where: { idDetalleOrden } });

    if (historia) {
      Object.assign(historia, campos, { idEspecialista });
    } else {
      historia = this.repo.create({
        idOrden,
        idDetalleOrden,
        fechaHistoria: new Date().toISOString().slice(0, 10),
        idEspecialista,
        estado: 'A',
        ...campos,
      } as Partial<HistoriaClinica>);
    }
    return this.repo.save(historia);
  }

  /** Firma/cierra la historia (equivalente a marcar el estudio como atendido). */
  async firmar(idDetalleOrden: number) {
    const historia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!historia) throw new NotFoundException('No hay historia clínica registrada para esta línea de orden');
    historia.estado = 'C';
    await this.repo.save(historia);
    await this.detalleOrdenRepo.update({ id: idDetalleOrden }, { estado: EstadoDetalleOrden.ATENDIDO });
    return historia;
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

  async addDiagnostico(dto: AddHistoriaDiagnosticoDto) {
    const fila = this.diagnosticosRepo.create(dto as Partial<HistoriaDiagnosticos>);
    return this.diagnosticosRepo.save(fila);
  }

  removeDiagnostico(idDetalleOrden: number, idOrden: number, idDiagnostico: string) {
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

  async addMedicamento(dto: AddHistoriaMedicamentoDto) {
    const fila = this.medicamentosRepo.create(dto as Partial<HistoriaMedicamentos>);
    return this.medicamentosRepo.save(fila);
  }

  removeMedicamento(idDetalleOrden: number, idOrden: number, idMedicamento: number) {
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

  async addLaboratorio(dto: AddHistoriaLaboratorioDto) {
    const fila = this.laboratoriosRepo.create({
      idOrden: dto.idOrden,
      idDetalleOrden: dto.idDetalleOrden,
      idLaboratorio: Number(dto.codigoCups),
      descripcion: dto.descripcion,
    } as Partial<HistoriaLaboratorios>);
    return this.laboratoriosRepo.save(fila);
  }

  removeLaboratorio(idDetalleOrden: number, idOrden: number, codigoCups: string) {
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

  async addProcedimiento(dto: AddHistoriaProcedimientoDto) {
    const fila = this.procedimientosRepo.create({
      idOrden: dto.idOrden,
      idDetalleOrden: dto.idDetalleOrden,
      idProcedimiento: Number(dto.codigoCups),
      descripcion: dto.descripcion,
    } as Partial<HistoriaProcedimientos>);
    return this.procedimientosRepo.save(fila);
  }

  removeProcedimiento(idDetalleOrden: number, idOrden: number, codigoCups: string) {
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

  async addRxs(dto: AddHistoriaRxsDto) {
    const fila = this.rxsRepo.create(dto as Partial<HistoriaRxs>);
    return this.rxsRepo.save(fila);
  }

  removeRxs(idDetalleOrden: number, idOrden: number, idRxs: number) {
    return this.rxsRepo.delete({ idDetalleOrden, idOrden, idRxs });
  }
}
