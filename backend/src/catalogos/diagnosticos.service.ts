import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';

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

  findByCodigo(codigo: string) {
    return this.repo.findOne({ where: { codigoDiagnostico: codigo } });
  }
}
