import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class DiagnosticosService {
  constructor(
    @InjectRepository(Diagnosticos)
    private readonly repo: Repository<Diagnosticos>,
  ) {}

  /** Sin paginar, para autocompletados (Patología, Órdenes). */
  async search(q: string) {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim();
    const porCodigo = await this.repo
      .createQueryBuilder('d')
      .where('d.codigoDiagnostico LIKE :term', { term: `${term.toUpperCase()}%` })
      .take(20)
      .getMany();
    if (porCodigo.length > 0) return porCodigo;
    return this.repo
      .createQueryBuilder('d')
      .where('d.nombreDiagnostico LIKE :term', { term: `%${term}%` })
      .take(20)
      .getMany();
  }

  /** Listado paginado para la grilla de administración (Complementos). */
  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo.createQueryBuilder('d').orderBy('d.codigoDiagnostico', 'ASC');
    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where('(d.codigoDiagnostico LIKE :term OR d.nombreDiagnostico LIKE :term)', { term });
    }
    return paginate(qb, page, pageSize);
  }

  findByCodigo(codigo: string) {
    return this.repo.findOne({ where: { codigoDiagnostico: codigo } });
  }

  async create(dto: CreateDiagnosticoDto) {
    const existente = await this.repo.findOne({ where: { codigoDiagnostico: dto.codigoDiagnostico } });
    if (existente) throw new ConflictException(`Ya existe el código CIE10 ${dto.codigoDiagnostico}`);
    const item = this.repo.create(dto);
    return this.repo.save(item);
  }

  async update(codigo: string, dto: Partial<CreateDiagnosticoDto>) {
    const item = await this.repo.findOne({ where: { codigoDiagnostico: codigo } });
    if (!item) throw new NotFoundException(`CIE10 ${codigo} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }
}
