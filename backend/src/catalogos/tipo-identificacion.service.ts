import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity';

@Injectable()
export class TipoIdentificacionService {
  constructor(
    @InjectRepository(TipoIdentificacion)
    private readonly repo: Repository<TipoIdentificacion>,
  ) {}

  findAll() {
    return this.repo.find({ order: { nombreTipoIdentificacion: 'ASC' } });
  }
}
