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

  /** Sin paginar, para autocompletados (Patología, Órdenes). Solo diagnósticos activos, igual que el resto de catálogos. */
  async search(q: string) {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim();
    const porCodigo = await this.repo
      .createQueryBuilder('d')
      .where('d.codigoDiagnostico LIKE :term', { term: `${term.toUpperCase()}%` })
      .andWhere("(d.estado = 'A' OR d.estado IS NULL)")
      .take(20)
      .getMany();
    if (porCodigo.length > 0) return porCodigo;
    return this.repo
      .createQueryBuilder('d')
      .where('d.nombreDiagnostico LIKE :term', { term: `%${term}%` })
      .andWhere("(d.estado = 'A' OR d.estado IS NULL)")
      .take(20)
      .getMany();
  }

  /** Listado paginado para la grilla de administración (Complementos). */
  findAll(page = 1, pageSize = 20, q?: string, estado?: string) {
    const qb = this.repo.createQueryBuilder('d').orderBy('d.codigoDiagnostico', 'ASC');
    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where('(d.codigoDiagnostico LIKE :term OR d.nombreDiagnostico LIKE :term)', { term });
    }
    if (estado === 'A' || estado === 'I') {
      qb.andWhere('d.estado = :estado', { estado });
    }
    return paginate(qb, page, pageSize);
  }

  findByCodigo(codigo: string) {
    return this.repo.findOne({ where: { codigoDiagnostico: codigo } });
  }

  async create(dto: CreateDiagnosticoDto) {
    const existente = await this.repo.findOne({ where: { codigoDiagnostico: dto.codigoDiagnostico } });
    if (existente) throw new ConflictException(`Ya existe el código CIE10 ${dto.codigoDiagnostico}`);
    const item = this.repo.create({ ...dto, estado: 'A' } as Partial<Diagnosticos>);
    return this.repo.save(item);
  }

  async update(codigo: string, dto: Partial<CreateDiagnosticoDto>) {
    const item = await this.repo.findOne({ where: { codigoDiagnostico: codigo } });
    if (!item) throw new NotFoundException(`CIE10 ${codigo} no encontrado`);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  /**
   * El campo real es char(3) nullable (no el enum EstadoActivoInactivo
   * estándar), pero sigue la misma convención 'A'/'I' -- confirmado en
   * DDiagnostico.vb: IF(estado='A','ACTIVO','INACTIVO').
   */
  async cambiarEstado(codigo: string, estado: 'A' | 'I') {
    const item = await this.repo.findOne({ where: { codigoDiagnostico: codigo } });
    if (!item) throw new NotFoundException(`CIE10 ${codigo} no encontrado`);
    item.estado = estado;
    return this.repo.save(item);
  }
}
