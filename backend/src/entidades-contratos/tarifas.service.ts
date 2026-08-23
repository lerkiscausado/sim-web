import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifas } from './entities/tarifas.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifas)
    private readonly repo: Repository<Tarifas>,
  ) {}

  findAllPaginado(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('t').orderBy('t.nombreTarifa', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('t.nombreTarifa LIKE :term', { term: `%${q.trim()}%` });
    }
    return paginate(qb, page, pageSize);
  }

  /** Sin paginar, para selects (formulario de Contratos). */
  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombreTarifa: 'ASC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Tarifa ${id} no encontrada`);
    return item;
  }

  create(dto: CreateTarifaDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateTarifaDto>) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async cambiarEstado(id: number, estado: EstadoActivoInactivo) {
    const item = await this.findOne(id);
    item.estado = estado;
    return this.repo.save(item);
  }
}
