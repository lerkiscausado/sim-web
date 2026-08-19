import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ordenes, EstadoOrden } from './entities/ordenes.entity';
import { DetalleOrden, EstadoDetalleOrden } from './entities/detalle-orden.entity';
import { TipoEstudio } from '../catalogos/entities/tipo-estudio.entity';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { CreateDetalleOrdenDto } from './dto/create-detalle-orden.dto';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 8);

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(DetalleOrden)
    private readonly detalleOrdenRepository: Repository<DetalleOrden>,
    @InjectRepository(TipoEstudio)
    private readonly tipoEstudioRepository: Repository<TipoEstudio>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Consecutivo = PREFIJO(tipo_estudio) + secuencial de órdenes de ESE tipo de
   * estudio en el año actual + "-AA". Mismo patrón que usa el VB.NET original
   * en Patología/Citología (prefijo + GenerarConsecutivo + año corto), pero
   * generalizado para cualquier tipo de estudio en vez de casos particulares
   * por sede.
   */
  private async generarConsecutivo(idTipoEstudio: number): Promise<string> {
    const tipoEstudio = await this.tipoEstudioRepository.findOne({ where: { id: idTipoEstudio } });
    if (!tipoEstudio) {
      throw new NotFoundException(`Tipo de estudio ${idTipoEstudio} no encontrado`);
    }
    const anioActual = new Date().getFullYear();
    const count = await this.ordenesRepository
      .createQueryBuilder('o')
      .where('o.idTipoEstudio = :idTipoEstudio', { idTipoEstudio })
      .andWhere('YEAR(o.fechaIngreso) = :anio', { anio: anioActual })
      .getCount();
    const anioCorto = String(anioActual).slice(-2);
    return `${tipoEstudio.prefijo}${count + 1}-${anioCorto}`;
  }

  /** Número de orden visible (correlativo simple global, distinto del consecutivo por tipo de estudio). */
  private async generarNumeroOrden(): Promise<string> {
    const total = await this.ordenesRepository.count();
    return String(total + 1).padStart(8, '0');
  }

  async create(dto: CreateOrdenDto, idEmpleado: number): Promise<Ordenes> {
    const consecutivo = await this.generarConsecutivo(dto.idTipoEstudio);
    const numeroOrden = await this.generarNumeroOrden();

    const orden = this.ordenesRepository.create({
      ...dto,
      idEmpleado,
      numeroOrden,
      consecutivo,
      fechaIngreso: hoyISO(),
      fechaOrden: dto.fechaOrden ?? hoyISO(),
      hora: horaActual(),
      idFactura: '',
      estado: EstadoOrden.PENDIENTE,
      saldo: 0,
    } as Partial<Ordenes>);

    return this.ordenesRepository.save(orden);
  }

  async findAll(page = 1, pageSize = 20, q?: string) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.contrato', 'contrato')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .orderBy('o.fechaIngreso', 'DESC')
      .addOrderBy('o.id', 'DESC')
      .take(take)
      .skip(skip);

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where(
        '(o.numeroOrden LIKE :term OR o.consecutivo LIKE :term OR paciente.identificacion LIKE :term OR paciente.primerNombre LIKE :term OR paciente.primerApellido LIKE :term)',
        { term },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize: take };
  }

  async findOne(id: number) {
    const orden = await this.ordenesRepository.findOne({
      where: { id },
      relations: ['paciente', 'contrato', 'subentidad', 'sede', 'empleado', 'tipoAfiliado', 'tipoUsuario', 'tipoEstudio', 'especimen'],
    });
    if (!orden) throw new NotFoundException(`Orden ${id} no encontrada`);
    return orden;
  }

  async findDetalles(idOrden: number) {
    return this.detalleOrdenRepository.find({
      where: { idOrden: String(idOrden) },
      relations: ['cups', 'tipoDiagnostico', 'formaRealizacion'],
      order: { id: 'ASC' },
    });
  }

  async findByPaciente(idUsuario: number) {
    return this.ordenesRepository.find({
      where: { idUsuario },
      relations: ['contrato', 'tipoEstudio'],
      order: { fechaIngreso: 'DESC' },
    });
  }

  /** Busca en detalle_tarifa el valor pactado para (tarifa del contrato de la orden, CUPS). */
  private async buscarValorTarifa(idOrden: number, codigoCups: string): Promise<number | null> {
    const orden = await this.ordenesRepository.findOne({ where: { id: idOrden } });
    if (!orden) return null;
    const contrato = await this.dataSource.query(
      'SELECT ID_TARIFA FROM contratos WHERE ID = ?',
      [orden.idContrato],
    );
    const idTarifa = contrato?.[0]?.ID_TARIFA;
    if (!idTarifa) return null;

    const rows = await this.dataSource.query(
      'SELECT VALOR FROM detalle_tarifa WHERE ID_TARIFA = ? AND CODIGO_CUPS = ? LIMIT 1',
      [String(idTarifa), codigoCups],
    );
    return rows?.[0]?.VALOR ?? null;
  }

  async addDetalle(idOrden: number, dto: CreateDetalleOrdenDto): Promise<DetalleOrden> {
    const orden = await this.findOne(idOrden);

    let valor = dto.valor;
    if (valor === undefined) {
      const valorTarifa = await this.buscarValorTarifa(idOrden, dto.codigoCups);
      if (valorTarifa === null) {
        throw new BadRequestException(
          `No se encontró tarifa pactada para el CUPS ${dto.codigoCups} en el contrato de esta orden. Indique el valor manualmente.`,
        );
      }
      valor = valorTarifa;
    }
    const copago = dto.copago ?? 0;

    const detalle = this.detalleOrdenRepository.create({
      idOrden: String(orden.id),
      idCausa: dto.idCausa,
      idFinalidadConsulta: dto.idFinalidadConsulta,
      idFinalidadProcedimiento: dto.idFinalidadProcedimiento,
      idAmbito: dto.idAmbito,
      idPersonaAtiende: dto.idPersonaAtiende,
      idTipoDiagnostico: dto.idTipoDiagnostico,
      diagnostico1: dto.diagnostico1,
      diagnostico2: dto.diagnostico2 ?? null,
      diagnostico3: dto.diagnostico3 ?? null,
      diagnostico4: dto.diagnostico4 ?? null,
      idFormaRealizacion: dto.idFormaRealizacion,
      codigoProcedimiento: dto.codigoCups,
      codigoCups: dto.codigoCups,
      idTipoEstudio: dto.idTipoEstudio,
      valor,
      copago,
      neto: valor - copago,
      tipo: dto.tipo as any,
      estado: EstadoDetalleOrden.PENDIENTE,
      idRelacion: '',
    } as Partial<DetalleOrden>);

    return this.detalleOrdenRepository.save(detalle);
  }

  async cancelarDetalle(idDetalle: number) {
    const detalle = await this.detalleOrdenRepository.findOne({ where: { id: idDetalle } });
    if (!detalle) throw new NotFoundException(`Línea de orden ${idDetalle} no encontrada`);
    detalle.estado = EstadoDetalleOrden.CANCELADO;
    return this.detalleOrdenRepository.save(detalle);
  }
}
