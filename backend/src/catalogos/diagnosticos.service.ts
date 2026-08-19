import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';

@Injectable()
export class DiagnosticosService {
  constructor(
    @InjectRepository(Diagnosticos)
    private readonly repo: Repository<Diagnosticos>,
  ) {}

  /** Búsqueda por código o nombre (CIE10), usada en los autocompletados. */
  async search(q: string) {
    if (!q || q.trim().length < 2) return [];
    const term = q.trim();
    const porCodigo = await this.repo.find({
      where: { codigoDiagnostico: Like(`${term.toUpperCase()}%`) },
      take: 20,
    });
    if (porCodigo.length > 0) return porCodigo;
    return this.repo.find({
      where: { nombreDiagnostico: Like(`%${term}%`) },
      take: 20,
    });
  }

  /** Listado paginado simple para la grilla de administración. */
  findAll(q?: string) {
    if (q && q.trim().length > 0) {
      return this.repo.find({
        where: [
          { codigoDiagnostico: Like(`%${q.trim().toUpperCase()}%`) },
          { nombreDiagnostico: Like(`%${q.trim()}%`) },
        ],
        order: { codigoDiagnostico: 'ASC' },
        take: 100,
      });
    }
    return this.repo.find({ order: { codigoDiagnostico: 'ASC' }, take: 100 });
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
