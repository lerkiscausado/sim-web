import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especimenes } from './entities/especimenes.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateEspecimenDto } from './dto/create-especimen.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class EspecimenesService {
  constructor(
    @InjectRepository(Especimenes)
    private readonly repo: Repository<Especimenes>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('e').orderBy('e.nombre', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('e.nombre LIKE :term', { term: `%${q.trim()}%` });
    }
    return paginate(qb, page, pageSize);
  }

  /** Sin paginar, para selects (Patología, Órdenes). */
  findActivos() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
      take: 300,
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Espécimen ${id} no encontrado`);
    return item;
  }

  create(dto: CreateEspecimenDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateEspecimenDto>) {
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
