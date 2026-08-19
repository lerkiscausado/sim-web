import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especialistas } from './entities/especialistas.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class EspecialistasService {
  constructor(
    @InjectRepository(Especialistas)
    private readonly repo: Repository<Especialistas>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }
}
