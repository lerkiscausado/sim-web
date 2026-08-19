import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sedes } from './entities/sedes.entity';
import { CreateSedeDto } from './dto/create-sede.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sedes)
    private readonly sedesRepository: Repository<Sedes>,
  ) {}

  findAll() {
    return this.sedesRepository.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const sede = await this.sedesRepository.findOne({ where: { id } });
    if (!sede) {
      throw new NotFoundException(`Sede ${id} no encontrada`);
    }
    return sede;
  }

  create(dto: CreateSedeDto) {
    const sede = this.sedesRepository.create({
      ...dto,
      estado: EstadoActivoInactivo.ACTIVO,
    });
    return this.sedesRepository.save(sede);
  }

  async update(id: number, dto: Partial<CreateSedeDto>) {
    const sede = await this.findOne(id);
    Object.assign(sede, dto);
    return this.sedesRepository.save(sede);
  }

  async desactivar(id: number) {
    const sede = await this.findOne(id);
    sede.estado = EstadoActivoInactivo.INACTIVO;
    return this.sedesRepository.save(sede);
  }
}
