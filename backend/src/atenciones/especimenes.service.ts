import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especimenes } from './entities/especimenes.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class EspecimenesService {
  constructor(
    @InjectRepository(Especimenes)
    private readonly especimenesRepository: Repository<Especimenes>,
  ) {}

  findAll() {
    return this.especimenesRepository.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }
}
