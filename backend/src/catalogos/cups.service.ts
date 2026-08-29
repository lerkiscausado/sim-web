import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cups } from './entities/cups.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateCupsDto } from './dto/create-cups.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class CupsService {
  constructor(
    @InjectRepository(Cups)
    private readonly repo: Repository<Cups>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string, estado?: string) {
    const qb = this.repo.createQueryBuilder('c').orderBy('c.codigoCups', 'ASC');
    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where('(c.codigoCups LIKE :term OR c.nombreCups LIKE :term)', { term });
    }
    if (estado === 'A' || estado === 'I') {
      qb.andWhere('c.estado = :estado', { estado });
    }
    return paginate(qb, page, pageSize);
  }

  /** Sin paginar, para autocompletados (Patología, Órdenes). */
  async search(q: string) {
    if (!q || q.trim().length < 2) return [];
    const term = `%${q.trim()}%`;
    return this.repo
      .createQueryBuilder('c')
      .where('(c.codigoCups LIKE :term OR c.nombreCups LIKE :term)', { term })
      .orderBy('c.codigoCups', 'ASC')
      .take(20)
      .getMany();
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
