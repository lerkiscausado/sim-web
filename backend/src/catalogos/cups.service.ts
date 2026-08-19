import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Cups } from './entities/cups.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateCupsDto } from './dto/create-cups.dto';

@Injectable()
export class CupsService {
  constructor(
    @InjectRepository(Cups)
    private readonly repo: Repository<Cups>,
  ) {}

  findAll(q?: string) {
    if (q && q.trim().length > 0) {
      return this.repo.find({
        where: [
          { codigoCups: Like(`%${q.trim()}%`) },
          { nombreCups: Like(`%${q.trim()}%`) },
        ],
        order: { codigoCups: 'ASC' },
        take: 100,
      });
    }
    return this.repo.find({ order: { codigoCups: 'ASC' }, take: 100 });
  }

  async findOne(codigo: string) {
    const item = await this.repo.findOne({ where: { codigoCups: codigo } });
    if (!item) throw new NotFoundException(`CUPS ${codigo} no encontrado`);
    return item;
  }

  async create(dto: CreateCupsDto) {
    const existente = await this.repo.findOne({ where: { codigoCups: dto.codigoCups } });
    if (existente) throw new ConflictException(`Ya existe el código CUPS ${dto.codigoCups}`);
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(codigo: string, dto: Partial<CreateCupsDto>) {
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
