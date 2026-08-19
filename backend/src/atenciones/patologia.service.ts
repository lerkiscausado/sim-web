import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patologia } from './entities/patologia.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { UpsertPatologiaDto } from './dto/upsert-patologia.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 8);

@Injectable()
export class PatologiaService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(EstudiosGenerados)
    private readonly estudiosGeneradosRepository: Repository<EstudiosGenerados>,
  ) {}

  /** Equivalente a DPatologia.Cargar(): el informe (si existe) de una orden puntual. */
  async findByOrden(idOrden: number): Promise<Patologia | null> {
    return this.patologiaRepository.findOne({
      where: { idOrden },
      relations: ['diagnosticoCie10', 'patologo', 'orden', 'orden.paciente', 'orden.contrato'],
    });
  }

  /**
   * Órdenes pendientes de informe de patología: en proceso/atendidas sin
   * registro en `patologia` todavía. Equivalente conceptual a la grilla
   * "Pacientes a atender" del formulario original.
   */
  async findPendientes(idSede?: number) {
    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .where('o.estado IN (:...estados)', {
        estados: [EstadoOrden.PROCESO, EstadoOrden.ATENDIDO],
      })
      .andWhere(
        'NOT EXISTS (SELECT 1 FROM patologia p WHERE p.ID_ORDEN = o.ID)',
      );

    if (idSede) {
      qb.andWhere('o.idSede = :idSede', { idSede });
    }

    return qb.orderBy('o.fechaIngreso', 'ASC').getMany();
  }

  /** Equivalente a DPatologia.ListarPatologiasPaciente(): resultados ya entregables de un paciente. */
  async findByPaciente(idUsuario: number) {
    return this.patologiaRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.orden', 'o')
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado IN (:...estados)', {
        estados: [EstadoOrden.ATENDIDO, EstadoOrden.FACTURADO],
      })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
  }

  /** Equivalente a DPatologia.ListarEstudiosAnteriores(): historial de estudios atendidos de un paciente. */
  async estudiosAnteriores(idUsuario: number) {
    return this.ordenesRepository
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.especimen', 'especimen')
      .innerJoin('patologia', 'p', 'p.ID_ORDEN = o.ID')
      .addSelect(['p.diagnostico'])
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado = :estado', { estado: EstadoOrden.ATENDIDO })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
  }

  /**
   * Equivalente a DPatologia.Guardar() + ActualizarEspecimen() + GuardarEstudioGenerado():
   * crea o actualiza el informe de la orden, opcionalmente actualiza el
   * espécimen de la orden, y deja el registro de auditoría en estudios_generados.
   */
  async upsert(dto: UpsertPatologiaDto, idEmpleado: number): Promise<Patologia> {
    const orden = await this.ordenesRepository.findOne({ where: { id: dto.idOrden } });
    if (!orden) {
      throw new NotFoundException(`Orden ${dto.idOrden} no encontrada`);
    }

    let patologia = await this.patologiaRepository.findOne({ where: { idOrden: dto.idOrden } });

    if (patologia) {
      Object.assign(patologia, {
        tipoMuestra: dto.tipoMuestra,
        sitioLesion: dto.sitioLesion,
        solicitado: dto.solicitado,
        descripcionMacroscopica: dto.descripcionMacroscopica,
        descripcionMicroscopica: dto.descripcionMicroscopica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones ?? '',
        codigoDiagnostico: dto.codigoDiagnostico,
        idEmpleado,
        fechaSalida: hoyISO(),
        estado: EstadoActivoInactivo.ACTIVO,
        codigoPatologia: dto.codigoPatologia ?? patologia.codigoPatologia,
      });
    } else {
      patologia = this.patologiaRepository.create({
        idOrden: dto.idOrden,
        fecha: hoyISO(),
        fechaSalida: hoyISO(),
        tipoMuestra: dto.tipoMuestra,
        sitioLesion: dto.sitioLesion,
        solicitado: dto.solicitado,
        descripcionMacroscopica: dto.descripcionMacroscopica,
        descripcionMicroscopica: dto.descripcionMicroscopica,
        diagnostico: dto.diagnostico,
        observaciones: dto.observaciones ?? '',
        codigoDiagnostico: dto.codigoDiagnostico,
        idEmpleado,
        estado: EstadoActivoInactivo.ACTIVO,
        codigoPatologia: dto.codigoPatologia ?? null,
      });
    }

    const guardada = await this.patologiaRepository.save(patologia);

    if (dto.idEspecimen) {
      orden.idEspecimen = dto.idEspecimen;
      await this.ordenesRepository.save(orden);
    }

    const log = this.estudiosGeneradosRepository.create({
      idOrden: dto.idOrden,
      idDetalleOrden: 0,
      fecha: hoyISO(),
      hora: horaActual(),
      estudio: 'PATOLOGIA',
      idEmpleado,
    });
    await this.estudiosGeneradosRepository.save(log);

    return guardada;
  }
}
