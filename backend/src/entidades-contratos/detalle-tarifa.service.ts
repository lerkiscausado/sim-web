import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleTarifa } from './entities/detalle-tarifa.entity';
import { Tarifas } from './entities/tarifas.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateDetalleTarifaDto } from './dto/create-detalle-tarifa.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class DetalleTarifaService {
  constructor(
    @InjectRepository(DetalleTarifa)
    private readonly repo: Repository<DetalleTarifa>,
    @InjectRepository(Tarifas)
    private readonly tarifasRepo: Repository<Tarifas>,
  ) {}

  private async verificarTarifa(idTarifa: number) {
    const tarifa = await this.tarifasRepo.findOne({ where: { id: idTarifa } });
    if (!tarifa) throw new NotFoundException(`Tarifa ${idTarifa} no encontrada`);
    return tarifa;
  }

  async findAllPaginado(idTarifa: number, page = 1, pageSize = 20, q?: string) {
    await this.verificarTarifa(idTarifa);
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.cups', 'cups')
      .where('d.idTarifa = :idTarifa', { idTarifa: String(idTarifa) })
      .andWhere('d.estado = :estado', { estado: EstadoActivoInactivo.ACTIVO })
      .orderBy('d.codigoCups', 'ASC');

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere('(d.codigoCups LIKE :term OR cups.nombreCups LIKE :term)', { term });
    }
    return paginate(qb, page, pageSize);
  }

  async create(idTarifa: number, dto: CreateDetalleTarifaDto): Promise<DetalleTarifa> {
    await this.verificarTarifa(idTarifa);

    const existente = await this.repo.findOne({
      where: { idTarifa: String(idTarifa), codigoProcedimiento: dto.codigoCups, estado: EstadoActivoInactivo.ACTIVO },
    });
    if (existente) {
      throw new ConflictException(`El CUPS ${dto.codigoCups} ya está registrado en esta tarifa`);
    }

    const fila = this.repo.create({
      idTarifa: String(idTarifa),
      codigoProcedimiento: dto.codigoCups,
      codigoCups: dto.codigoCups,
      idTipoEstudio: dto.idTipoEstudio,
      valor: dto.valor,
      descuento: dto.descuento ?? 0,
      tipoAtencion: dto.tipoAtencion,
      estado: EstadoActivoInactivo.ACTIVO,
    } as Partial<DetalleTarifa>);

    return this.repo.save(fila);
  }

  async update(id: number, dto: Partial<CreateDetalleTarifaDto>): Promise<DetalleTarifa> {
    const fila = await this.repo.findOne({ where: { id } });
    if (!fila) throw new NotFoundException(`Detalle de tarifa ${id} no encontrado`);
    Object.assign(fila, dto);
    if (dto.codigoCups) {
      fila.codigoCups = dto.codigoCups;
      fila.codigoProcedimiento = dto.codigoCups;
    }
    return this.repo.save(fila);
  }

  async eliminar(id: number): Promise<DetalleTarifa> {
    const fila = await this.repo.findOne({ where: { id } });
    if (!fila) throw new NotFoundException(`Detalle de tarifa ${id} no encontrado`);
    fila.estado = EstadoActivoInactivo.INACTIVO;
    return this.repo.save(fila);
  }
}
