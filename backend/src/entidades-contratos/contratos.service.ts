import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Contratos } from './entities/contratos.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { paginate } from '../common/pagination';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class ContratosService {
  constructor(
    @InjectRepository(Contratos)
    private readonly repo: Repository<Contratos>,
  ) {}

  findAll(page = 1, pageSize = 20, q?: string) {
    // .createQueryBuilder() no filtra soft-delete automáticamente como sí
    // hacen find()/findOne(); se agrega el filtro explícito.
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.entidad', 'entidad')
      .leftJoinAndSelect('c.tarifa', 'tarifa')
      .where('c.deletedAt IS NULL')
      .orderBy('c.nombre', 'ASC');

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere('(c.nombre LIKE :term OR c.numeroContrato LIKE :term OR c.codigoEntidad LIKE :term)', { term });
    }
    return paginate(qb, page, pageSize);
  }

  /** Lista completa (sin paginar) de contratos activos, para selects (Órdenes). */
  findActivos() {
    return this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.entidad', 'entidad')
      .where('c.deletedAt IS NULL')
      .andWhere('c.estado = :estado', { estado: EstadoActivoInactivo.ACTIVO })
      .orderBy('c.nombre', 'ASC')
      .take(300)
      .getMany();
  }

  async findOne(id: number) {
    // find()/findOne() del repositorio SÍ excluyen automáticamente las
    // filas con soft-delete (a diferencia del QueryBuilder de arriba).
    const item = await this.repo.findOne({
      where: { id },
      relations: ['entidad', 'tarifa', 'licencia'],
    });
    if (!item) throw new NotFoundException(`Contrato ${id} no encontrado`);
    return item;
  }

  async create(dto: CreateContratoDto) {
    const contrasenaHash = await bcrypt.hash(dto.contrasena, BCRYPT_ROUNDS);
    const item = this.repo.create({
      ...dto,
      contrasena: contrasenaHash,
      estado: EstadoActivoInactivo.ACTIVO,
    } as Partial<Contratos>);
    return this.repo.save(item);
  }

  async update(id: number, dto: Partial<CreateContratoDto>) {
    const item = await this.findOne(id);
    const { contrasena, ...resto } = dto;
    Object.assign(item, resto);
    // Solo se re-encripta si el usuario realmente envió una contraseña
    // nueva; si el campo viene vacío/omitido, se conserva el hash actual.
    if (contrasena) {
      item.contrasena = await bcrypt.hash(contrasena, BCRYPT_ROUNDS);
    }
    return this.repo.save(item);
  }

  async cambiarEstado(id: number, estado: EstadoActivoInactivo) {
    const item = await this.findOne(id);
    item.estado = estado;
    return this.repo.save(item);
  }

  /** Soft delete: marca deletedAt en vez de borrar la fila físicamente. */
  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.softDelete(id);
    return item;
  }
}
