import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicamentos } from './entities/medicamentos.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class MedicamentosService {
  constructor(
    @InjectRepository(Medicamentos)
    private readonly repo: Repository<Medicamentos>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string, estado?: string) {
    const qb = this.repo.createQueryBuilder('m').orderBy('m.nombre', 'ASC');
    if (q && q.trim().length > 0) {
      qb.where('m.nombre LIKE :term', { term: `%${q.trim()}%` });
    }
    if (estado === 'A' || estado === 'I') {
      qb.andWhere('m.estado = :estado', { estado });
    }
    return paginate(qb, page, pageSize);
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Medicamento ${id} no encontrado`);
    return item;
  }

  create(dto: CreateMedicamentoDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateMedicamentoDto>) {
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
