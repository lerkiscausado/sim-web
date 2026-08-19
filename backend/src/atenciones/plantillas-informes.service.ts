import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlantillasInformes } from './entities/plantillas-informes.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreatePlantillaInformeDto } from './dto/create-plantilla-informe.dto';

@Injectable()
export class PlantillasInformesService {
  constructor(
    @InjectRepository(PlantillasInformes)
    private readonly repo: Repository<PlantillasInformes>,
  ) {}

  findAll(idTipoEstudio?: number, idEspecialista?: number) {
    return this.repo.find({
      where: {
        estado: EstadoActivoInactivo.ACTIVO,
        ...(idTipoEstudio ? { idTipoEstudio } : {}),
        ...(idEspecialista ? { idEspecialista } : {}),
      },
      relations: ['tipoEstudio', 'especialista'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['tipoEstudio', 'especialista'],
    });
    if (!item) throw new NotFoundException(`Plantilla ${id} no encontrada`);
    return item;
  }

  create(dto: CreatePlantillaInformeDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO });
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreatePlantillaInformeDto>) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async desactivar(id: number) {
    const item = await this.findOne(id);
    item.estado = EstadoActivoInactivo.INACTIVO;
    return this.repo.save(item);
  }
}
