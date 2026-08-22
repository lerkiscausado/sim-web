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

  /** Devuelve la foto (bytes + tipo mime detectado por firma) o null si no tiene una cargada. */
  async getFoto(id: number): Promise<{ buffer: Buffer; contentType: string } | null> {
    const row = await this.repo
      .createQueryBuilder('u')
      .select('u.foto', 'foto')
      .where('u.id = :id', { id })
      .getRawOne<{ foto: Buffer | null }>();

    const buffer = row?.foto;
    if (!buffer || buffer.length === 0) return null;

    return { buffer, contentType: detectarTipoImagen(buffer) };
  }
}

/** Firma (magic bytes) para detectar el formato real de la imagen guardada como blob. */
function detectarTipoImagen(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 6) === 'GIF89a') {
    return 'image/gif';
  }
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 6) === 'GIF87a') {
    return 'image/gif';
  }
  return 'application/octet-stream';
}
