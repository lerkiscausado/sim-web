import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleados } from './entities/empleados.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleados)
    private readonly repo: Repository<Empleados>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      relations: ['cargo'],
      order: { nombreEmpleado: 'ASC' },
    });
  }
}
