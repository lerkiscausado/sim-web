import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Usuarios } from './entities/usuarios.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Usuarios)
    private readonly repo: Repository<Usuarios>,
  ) {}

  async findAll(page = 1, pageSize = 20, q?: string): Promise<PaginatedResult<Usuarios>> {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.tipoIdentificacion', 'tipoIdentificacion')
      .leftJoinAndSelect('u.tipoUsuario', 'tipoUsuario')
      .orderBy('u.primerApellido', 'ASC')
      .addOrderBy('u.primerNombre', 'ASC')
      .take(take)
      .skip(skip);

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.where(
        '(u.identificacion LIKE :term OR u.primerNombre LIKE :term OR u.primerApellido LIKE :term OR u.segundoNombre LIKE :term OR u.segundoApellido LIKE :term)',
        { term },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, pageSize: take };
  }

  async findOne(id: number) {
    const paciente = await this.repo.findOne({
      where: { id },
      relations: ['tipoIdentificacion', 'tipoUsuario'],
    });
    if (!paciente) throw new NotFoundException(`Paciente ${id} no encontrado`);
    return paciente;
  }

  async create(dto: CreatePacienteDto) {
    const existente = await this.repo.findOne({ where: { identificacion: dto.identificacion } });
    if (existente) {
      throw new ConflictException(`Ya existe un paciente con identificación ${dto.identificacion}`);
    }
    const paciente = this.repo.create({
      ...dto,
      // FOTO es NOT NULL en la BD real sin default; se deja vacía hasta que
      // se suba una foto (funcionalidad de carga de imagen pendiente).
      foto: Buffer.alloc(0),
    });
    return this.repo.save(paciente);
  }

  async update(id: number, dto: Partial<CreatePacienteDto>) {
    const paciente = await this.findOne(id);
    Object.assign(paciente, dto);
    return this.repo.save(paciente);
  }
}
