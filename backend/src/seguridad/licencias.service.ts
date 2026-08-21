import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licencias } from './entities/licencias.entity';

@Injectable()
export class LicenciasService {
  constructor(
    @InjectRepository(Licencias)
    private readonly repo: Repository<Licencias>,
  ) {}

  /** Única licencia activa (despliegue de una sola sede/licencia). */
  findActiva() {
    return this.repo.findOne({ where: { estado: 'A' } });
  }
}
