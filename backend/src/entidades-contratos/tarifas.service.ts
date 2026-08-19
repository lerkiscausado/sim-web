import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifas } from './entities/tarifas.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifas)
    private readonly repo: Repository<Tarifas>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombreTarifa: 'ASC' },
    });
  }
}
