import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especialidades } from './entities/especialidades.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class EspecialidadesService {
  constructor(
    @InjectRepository(Especialidades)
    private readonly repo: Repository<Especialidades>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('e').orderBy('e.nombreEspecialidad', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('e.nombreEspecialidad LIKE :term', { term: `%${q.trim()}%` });
    }
    return paginate(qb, page, pageSize);
  }

  findActivas() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombreEspecialidad: 'ASC' },
      take: 300,
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Especialidad ${id} no encontrada`);
    return item;
  }

  create(dto: CreateEspecialidadDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateEspecialidadDto>) {
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
