import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from './entities/users.entity';
import { Licencias } from './entities/licencias.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PERMISOS_USUARIO, PermisoUsuario } from './constants/permisos';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Licencias)
    private readonly licenciasRepository: Repository<Licencias>,
  ) {}

  /** Convierte el mapa de permisos boolean (API) a los char(1) '0'/'1' que espera la BD real. */
  private mapPermisos(permisos?: Partial<Record<PermisoUsuario, boolean>>) {
    const result: Record<string, string> = {};
    for (const key of PERMISOS_USUARIO) {
      result[key] = permisos?.[key] ? '1' : '0';
    }
    return result;
  }

  private async licenciaActivaId(): Promise<number> {
    const activa = await this.licenciasRepository.findOne({ where: { estado: 'A' } });
    if (activa) return activa.id;
    const cualquiera = await this.licenciasRepository.findOne({ where: {} });
    if (!cualquiera) {
      throw new NotFoundException('No hay ninguna licencia registrada en el sistema');
    }
    return cualquiera.id;
  }

  /** Listado para la grilla: nombre de empleado, cargo, usuario, estado. Un usuario por empleado (regla del VB.NET original). */
  findAll() {
    return this.usersRepository.find({
      relations: ['empleado', 'empleado.cargo'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['empleado', 'empleado.cargo'],
    });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async create(dto: CreateUserDto): Promise<Users> {
    const existingUsuario = await this.usersRepository.findOne({
      where: { usuario: dto.usuario },
    });
    if (existingUsuario) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Regla del VB.NET original (frmUsers.bbiGuardar): un empleado no puede
    // tener más de una cuenta de usuario del sistema.
    const existingEmpleado = await this.usersRepository.findOne({
      where: { idEmpleado: dto.idEmpleado },
    });
    if (existingEmpleado) {
      throw new ConflictException('Ese empleado ya tiene un usuario registrado');
    }

    const hashedPass = await bcrypt.hash(dto.pass, BCRYPT_ROUNDS);
    const idLicencia = await this.licenciaActivaId();

    const nuevoUsuario = this.usersRepository.create({
      idEmpleado: dto.idEmpleado,
      usuario: dto.usuario,
      pass: hashedPass,
      idLicencia,
      admin: dto.admin ? '1' : '0',
      estado: EstadoActivoInactivoEliminado.ACTIVO,
      ...this.mapPermisos(dto.permisos),
    } as Partial<Users>);

    return this.usersRepository.save(nuevoUsuario);
  }

  async update(id: number, dto: UpdateUserDto): Promise<Users> {
    const user = await this.findOne(id);

    if (dto.usuario && dto.usuario !== user.usuario) {
      const existing = await this.usersRepository.findOne({ where: { usuario: dto.usuario } });
      if (existing && existing.id !== id) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
      user.usuario = dto.usuario;
    }

    if (dto.pass) {
      user.pass = await bcrypt.hash(dto.pass, BCRYPT_ROUNDS);
    }

    if (dto.admin !== undefined) {
      user.admin = dto.admin ? '1' : '0';
    }

    if (dto.activo !== undefined) {
      user.estado = dto.activo ? EstadoActivoInactivoEliminado.ACTIVO : EstadoActivoInactivoEliminado.INACTIVO;
    }

    if (dto.permisos) {
      Object.assign(user, this.mapPermisos(dto.permisos));
    }

    return this.usersRepository.save(user);
  }

  /** Trae el usuario CON el hash de PASS (por defecto la entity lo excluye con select:false). */
  async findOneByUsuarioWithPassword(usuario: string): Promise<Users | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.pass')
      .where('u.usuario = :usuario', { usuario })
      .getOne();
  }

  async findOneById(id: number): Promise<Users | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /** Arma el mapa de permisos boolean a partir de la entity, para incluir en el JWT / respuestas. */
  buildPermisosMap(user: Users): Record<PermisoUsuario, boolean> {
    const permisos = {} as Record<PermisoUsuario, boolean>;
    for (const key of PERMISOS_USUARIO) {
      permisos[key] = (user as any)[key] === '1';
    }
    return permisos;
  }
}
