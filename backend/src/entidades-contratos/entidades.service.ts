import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entidades } from './entities/entidades.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateEntidadDto } from './dto/create-entidad.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class EntidadesService {
  constructor(
    @InjectRepository(Entidades)
    private readonly repo: Repository<Entidades>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string, estado?: string) {
    const qb = this.repo.createQueryBuilder('e').orderBy('e.nombreEntidad', 'ASC');
    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where('(e.codigoEntidad LIKE :term OR e.nombreEntidad LIKE :term OR e.nit LIKE :term)', { term });
    }
    if (estado === 'A' || estado === 'I') {
      qb.andWhere('e.estado = :estado', { estado });
    }
    return paginate(qb, page, pageSize);
  }

  /** Lista completa (sin paginar) de entidades activas, para selects (Contratos). */
  findActivas() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombreEntidad: 'ASC' },
      take: 300,
    });
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
