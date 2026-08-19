import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Entidades } from './entities/entidades.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateEntidadDto } from './dto/create-entidad.dto';

@Injectable()
export class EntidadesService {
  constructor(
    @InjectRepository(Entidades)
    private readonly repo: Repository<Entidades>,
  ) {}

  findAll(q?: string) {
    if (q && q.trim().length > 0) {
      return this.repo.find({
        where: [
          { codigoEntidad: Like(`%${q.trim()}%`) },
          { nombreEntidad: Like(`%${q.trim()}%`) },
          { nit: Like(`%${q.trim()}%`) },
        ],
        order: { nombreEntidad: 'ASC' },
        take: 100,
      });
    }
    return this.repo.find({ order: { nombreEntidad: 'ASC' }, take: 100 });
  }

  async findOne(codigo: string) {
    const item = await this.repo.findOne({ where: { codigoEntidad: codigo } });
    if (!item) throw new NotFoundException(`Entidad ${codigo} no encontrada`);
    return item;
  }

  async create(dto: CreateEntidadDto) {
    const existente = await this.repo.findOne({ where: { codigoEntidad: dto.codigoEntidad } });
    if (existente) throw new ConflictException(`Ya existe la entidad ${dto.codigoEntidad}`);
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(codigo: string, dto: Partial<CreateEntidadDto>) {
    const item = await this.findOne(codigo);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async cambiarEstado(codigo: string, estado: EstadoActivoInactivo) {
    const item = await this.findOne(codigo);
    item.estado = estado;
    return this.repo.save(item);
  }
}
