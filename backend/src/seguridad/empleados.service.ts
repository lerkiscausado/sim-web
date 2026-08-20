import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleados } from './entities/empleados.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleados)
    private readonly repo: Repository<Empleados>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.cargo', 'cargo')
      .leftJoinAndSelect('e.especialidad', 'especialidad')
      .orderBy('e.nombreEmpleado', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('e.nombreEmpleado LIKE :term', { term: `%${q.trim()}%` });
    }
    return paginate(qb, page, pageSize);
  }

  /** Sin paginar, para selects (Usuarios de Sistema, etc.). */
  findActivos() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      relations: ['cargo'],
      order: { nombreEmpleado: 'ASC' },
      take: 500,
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ['cargo', 'especialidad'] });
    if (!item) throw new NotFoundException(`Empleado ${id} no encontrado`);
    return item;
  }

  create(dto: CreateEmpleadoDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateEmpleadoDto>) {
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
