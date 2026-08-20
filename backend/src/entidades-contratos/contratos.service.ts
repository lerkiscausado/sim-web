import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contratos } from './entities/contratos.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { paginate } from '../common/pagination';

@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Contratos)
    private readonly repo: Repository<Contratos>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.entidad', 'entidad')
      .leftJoinAndSelect('c.tarifa', 'tarifa')
      .orderBy('c.nombre', 'ASC');

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where('(c.nombre LIKE :term OR c.numeroContrato LIKE :term OR c.codigoEntidad LIKE :term)', { term });
    }
    return paginate(qb, page, pageSize);
  }

  /** Lista completa (sin paginar) de contratos activos, para selects (Órdenes). */
  findActivos() {
    return this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.entidad', 'entidad')
      .where('c.estado = :estado', { estado: EstadoActivoInactivo.ACTIVO })
      .orderBy('c.nombre', 'ASC')
      .take(300)
      .getMany();
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ['entidad', 'tarifa', 'licencia'],
    });
    if (!item) throw new NotFoundException(`Contrato ${id} no encontrado`);
    return item;
  }

  create(dto: CreateContratoDto) {
    const item = this.repo.create({ ...dto, estado: EstadoActivoInactivo.ACTIVO } as Partial<Contratos>);
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateContratoDto>) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async cambiarEstado(id: number, estado: EstadoActivoInactivo) {
    const item = await this.findOne(id);
    item.estado = estado;
    return this.repo.save(item);
  }
}
