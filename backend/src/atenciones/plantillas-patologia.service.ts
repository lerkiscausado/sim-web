import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillasPatologia } from './entities/plantillas-patologia.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreatePlantillaPatologiaDto } from './dto/create-plantilla-patologia.dto';

@Injectable()
export class PlantillasPatologiaService {
  constructor(
    @InjectRepository(PlantillasPatologia)
    private readonly repo: Repository<PlantillasPatologia>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const plantilla = await this.repo.findOne({ where: { id } });
    if (!plantilla) {
      throw new NotFoundException(`Plantilla ${id} no encontrada`);
    }
    return plantilla;
  }

  create(dto: CreatePlantillaPatologiaDto) {
    const plantilla = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(plantilla);
  }

  async update(id: number, dto: Partial<CreatePlantillaPatologiaDto>) {
    const plantilla = await this.findOne(id);
    Object.assign(plantilla, dto);
    return this.repo.save(plantilla);
  }

  async desactivar(id: number) {
    const plantilla = await this.findOne(id);
    plantilla.estado = EstadoActivoInactivo.INACTIVO;
    return this.repo.save(plantilla);
  }
}
