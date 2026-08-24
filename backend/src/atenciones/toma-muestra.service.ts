import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TomaMuestra } from './entities/toma-muestra.entity';
import { UpsertTomaMuestraDto } from './dto/upsert-toma-muestra.dto';

@Injectable()
export class TomaMuestraService {
  constructor(
    @InjectRepository(TomaMuestra)
    private readonly repo: Repository<TomaMuestra>,
  ) {}

  /** Equivalente a DTomaMuestra.Existe() + Cargar(): antecedentes del paciente, si ya los tiene registrados. */
  async findByUsuario(idUsuario: number): Promise<TomaMuestra | null> {
    return this.repo.findOne({ where: { idUsuario } });
  }

  /** Equivalente a DTomaMuestra.Guardar(): crea o actualiza los antecedentes del paciente. */
  async upsert(dto: UpsertTomaMuestraDto): Promise<TomaMuestra> {
    let registro = await this.repo.findOne({ where: { idUsuario: dto.idUsuario } });
    if (registro) {
      Object.assign(registro, dto);
    } else {
      registro = this.repo.create(dto as Partial<TomaMuestra>);
    }
    return this.repo.save(registro);
  }
}
