import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Ordenes, EstadoOrden } from './entities/ordenes.entity';
import { DetalleOrden, EstadoDetalleOrden } from './entities/detalle-orden.entity';
import { TipoEstudio } from '../catalogos/entities/tipo-estudio.entity';
import { EntregaResultados } from '../atenciones/entities/entrega-resultados.entity';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { CreateDetalleOrdenDto } from './dto/create-detalle-orden.dto';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const horaActual = () => new Date().toTimeString().slice(0, 8);

/**
 * Valores fijos por código para los campos RIPS de detalle_orden que el
 * formulario VB.NET real (frmOrdenes.vb -> GuardarDetalleOrden()) NO expone
 * como selects — se guardan siempre igual, sin importar el usuario:
 *   IdCausa=15, IdFinalidadConsulta=10, IdFinalidadProcedimiento=1,
 *   IdPersonaAtiende=1, IdTipoDiagnostico=1, IdFormaRealizacion=1.
 * El único campo RIPS realmente seleccionable en pantalla es "Ámbito del
 * Procedimiento" (IdAmbito), que sí llega en el DTO.
 */
const DETALLE_ORDEN_DEFAULTS_RIPS = {
  idCausa: 15,
  idFinalidadConsulta: 10,
  idFinalidadProcedimiento: 1,
  idPersonaAtiende: 1,
  idTipoDiagnostico: 1,
  idFormaRealizacion: 1,
};

/** Suma N días hábiles (lunes a viernes) a una fecha ISO (yyyy-mm-dd). */
function sumarDiasHabiles(fechaISO: string, dias: number): string {
  const fecha = new Date(fechaISO + 'T00:00:00');
  let agregados = 0;
  while (agregados < dias) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay(); // 0=domingo, 6=sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      agregados++;
    }
  }
  return fecha.toISOString().slice(0, 10);
}

@Injectable()
export class OrdenesService {
  constructor(
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(DetalleOrden)
    private readonly detalleOrdenRepository: Repository<DetalleOrden>,
    @InjectRepository(TipoEstudio)
    private readonly tipoEstudioRepository: Repository<TipoEstudio>,
    @InjectRepository(EntregaResultados)
    private readonly entregaResultadosRepository: Repository<EntregaResultados>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * "Cons. Estudio" = PREFIJO(tipo_estudio) + secuencial de órdenes de ESE
   * tipo de estudio en el año actual + "-AA". Mismo patrón que usa el
   * VB.NET original en Patología/Citología (prefijo + GenerarConsecutivo +
   * año corto); se simplifica la variante con offsets 60000/10000/30000
   * específicos de una sede particular del sistema original, por no ser
   * generalizable a cualquier despliegue.
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

  /** "No. de Orden": sugerido automáticamente, editable por el usuario en el formulario real. */
  private async generarNumeroOrden(): Promise<string> {
    const total = await this.ordenesRepository.count();
    return String(total + 1).padStart(8, '0');
  }

  async create(dto: CreateOrdenDto): Promise<Ordenes> {
    const consecutivo = await this.generarConsecutivo(dto.idTipoEstudio);
    const numeroOrdenSugerido = dto.numeroOrden || (await this.generarNumeroOrden());
    const fechaOrden = dto.fechaOrden ?? hoyISO();

    const orden = this.ordenesRepository.create({
      ...dto,
      numeroOrden: numeroOrdenSugerido,
      consecutivo,
      fechaIngreso: hoyISO(),
      fechaOrden,
      hora: horaActual(),
      idFactura: '',
      estado: EstadoOrden.PENDIENTE,
      saldo: 0,
    } as Partial<Ordenes>);

    const guardada = await this.ordenesRepository.save(orden);

    // Fecha de entrega = fecha de orden + 7 días hábiles (regla de negocio
    // indicada), guardada en entrega_resultados igual que el VB.NET original
    // (GuardarEntregaResultados()).
    const fechaEntrega = sumarDiasHabiles(fechaOrden, 7);
    const entrega = this.entregaResultadosRepository.create({
      idOrden: guardada.id,
      fechaEntrega,
      tipoEstudio: dto.idTipoEstudio,
    });
    await this.entregaResultadosRepository.save(entrega);

    return guardada;
  }

  async findAll(page = 1, pageSize = 20, q?: string) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.contrato', 'contrato')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.sede', 'sede')
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
      'SELECT VALOR FROM detalle_tarifa WHERE ID_TARIFA = ? AND CODIGO_PROCEDIMIENTO = ? LIMIT 1',
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
      ...DETALLE_ORDEN_DEFAULTS_RIPS,
      idAmbito: dto.idAmbito,
      diagnostico1: null,
      diagnostico2: null,
      diagnostico3: null,
      diagnostico4: null,
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
