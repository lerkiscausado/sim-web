import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargos } from './entities/cargos.entity';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class CargosService {
  constructor(
    @InjectRepository(Cargos)
    private readonly repo: Repository<Cargos>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.nombreCargo', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('c.nombreCargo LIKE :term', { term: `%${q.trim()}%` });
    }
    return paginate(qb, page, pageSize);
  }

  findActivos() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivoEliminado.ACTIVO },
      order: { nombreCargo: 'ASC' },
      take: 300,
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Cargo ${id} no encontrado`);
    return item;
  }

  create(dto: CreateCargoDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivoEliminado.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateCargoDto>) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async cambiarEstado(id: number, estado: EstadoActivoInactivoEliminado) {
    const item = await this.findOne(id);
    item.estado = estado;
    return this.repo.save(item);
  }
}
