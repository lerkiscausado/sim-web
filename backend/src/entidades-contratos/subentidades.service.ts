import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subentidades } from './entities/subentidades.entity';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

@Injectable()
export class SubentidadesService {
  constructor(
    @InjectRepository(Subentidades)
    private readonly repo: Repository<Subentidades>,
  ) {}

  findByContrato(idContrato: number) {
    return this.repo.find({
      where: { idContrato, estado: EstadoActivoInactivoEliminado.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }
}
