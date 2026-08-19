import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Medicamentos } from './entities/medicamentos.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';

@Injectable()
export class MedicamentosService {
  constructor(
    @InjectRepository(Medicamentos)
    private readonly repo: Repository<Medicamentos>,
  ) {}

  findAll(q?: string) {
    if (q && q.trim().length > 0) {
      return this.repo.find({
        where: { nombre: Like(`%${q.trim()}%`) },
        order: { nombre: 'ASC' },
        take: 100,
      });
    }
    return this.repo.find({ order: { nombre: 'ASC' }, take: 100 });
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
