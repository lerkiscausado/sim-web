import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoEstudio } from './entities/tipo-estudio.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class TipoEstudioService {
  constructor(
    @InjectRepository(TipoEstudio)
    private readonly repo: Repository<TipoEstudio>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombreTipoEstudio: 'ASC' },
    });
  }
}
