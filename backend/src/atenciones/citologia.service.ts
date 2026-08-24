import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citologia } from './entities/citologia.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { UpsertCitologiaDto } from './dto/upsert-citologia.dto';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 8);

/** CUPS de citología cérvico-uterina que exige el filtro real (convencional / base líquida). */
const CUPS_CITOLOGIA = ['898001', '898002'];

@Injectable()
export class CitologiaService {
  constructor(
    @InjectRepository(Citologia)
    private readonly citologiaRepository: Repository<Citologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(EstudiosGenerados)
    private readonly estudiosGeneradosRepository: Repository<EstudiosGenerados>,
  ) {}

  /** Equivalente a DCitologia.Cargar(): el informe (si existe) de una orden puntual. */
  async findByOrden(idOrden: number): Promise<Citologia | null> {
    return this.citologiaRepository.findOne({
      where: { idOrden },
      relations: ['orden', 'orden.paciente', 'orden.contrato'],
    });
  }

  /**
   * Cola de trabajo de Citología: réplica exacta de DOrdenes.ListarCitologias()
   * del VB.NET original (frmCitologiaGeneral -> _dordenes.ListarCitologias).
   *
   * Filtro real: tipo_estudio.PREFIJO IN ('CV','CB','CR') AND
   * ESTADO NOT IN ('ATENDIDO','CANCELADO','FACTURADO') AND existe una línea
   * en detalle_orden con CUPS 898001 (citología convencional) u 898002
   * (citología en base líquida) -- son los dos códigos reales de citología
   * cérvico-uterina, el filtro con el que el formulario original acota la
   * grilla a estudios de citología (no cualquier estudio de esos prefijos).
   */
  async findPendientes(q?: string) {
    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .innerJoin('detalle_orden', 'd', 'd.ID_ORDEN = o.ID')
      .where('tipoEstudio.prefijo IN (:...prefijos)', { prefijos: ['CV', 'CB', 'CR'] })
      .andWhere('o.estado NOT IN (:...estadosExcluidos)', {
        estadosExcluidos: [EstadoOrden.ATENDIDO, EstadoOrden.CANCELADO, EstadoOrden.FACTURADO],
      })
      .andWhere('d.CODIGO_CUPS IN (:...cupsCitologia)', { cupsCitologia: CUPS_CITOLOGIA });

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(o.numeroOrden LIKE :term OR o.consecutivo LIKE :term OR paciente.identificacion LIKE :term ' +
          'OR paciente.primerNombre LIKE :term OR paciente.segundoNombre LIKE :term ' +
          'OR paciente.primerApellido LIKE :term OR paciente.segundoApellido LIKE :term)',
        { term },
      );
    }

    const ordenes = await qb.orderBy('o.fechaIngreso', 'ASC').getMany();
    if (ordenes.length === 0) return [];

    const ids = ordenes.map((o) => o.id);
    const conInforme = await this.citologiaRepository
      .createQueryBuilder('c')
      .select('c.idOrden', 'idOrden')
      .where('c.idOrden IN (:...ids)', { ids })
      .getRawMany<{ idOrden: number }>();
    const idsConInforme = new Set(conInforme.map((r) => Number(r.idOrden)));

    return ordenes.map((o) => ({ ...o, tieneInforme: idsConInforme.has(o.id) }));
  }

  /**
   * Equivalente a DOrdenes.ListarEstudiosAnteriores(): historial de estudios
   * ya atendidos del paciente, del más reciente al más antiguo.
   */
  async estudiosAnteriores(idUsuario: number) {
    return this.citologiaRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.orden', 'o')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado = :estado', { estado: EstadoOrden.ATENDIDO })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
  }

  /**
   * Equivalente a DCitologia.Guardar() + GuardarEstudioGenerado(): crea o
   * actualiza el informe de citología de la orden y deja el registro de
   * auditoría en estudios_generados.
   */
  async upsert(dto: UpsertCitologiaDto, idEmpleado: number): Promise<Citologia> {
    const orden = await this.ordenesRepository.findOne({ where: { id: dto.idOrden } });
    if (!orden) {
      throw new NotFoundException(`Orden ${dto.idOrden} no encontrada`);
    }

    const { idOrden, fechaSalida, ...campos } = dto;
    let citologia = await this.citologiaRepository.findOne({ where: { idOrden } });

    if (citologia) {
      Object.assign(citologia, { ...campos, idEmpleado });
    } else {
      citologia = this.citologiaRepository.create({
        idOrden,
        fecha: hoyISO(),
        ...campos,
        img1: '',
        img2: '',
        idEmpleado,
      } as Partial<Citologia>);
    }

    const guardada = await this.citologiaRepository.save(citologia);

    const log = this.estudiosGeneradosRepository.create({
      idOrden: dto.idOrden,
      idDetalleOrden: 0,
      fecha: hoyISO(),
      hora: horaActual(),
      estudio: 'CITOLOGIA',
      idEmpleado,
    });
    await this.estudiosGeneradosRepository.save(log);

    return guardada;
  }
}
