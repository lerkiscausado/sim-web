import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { PERMISOS_USUARIO, PermisoUsuario } from './constants/permisos';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  /** Convierte el mapa de permisos boolean (API) a los char(1) '0'/'1' que espera la BD real. */
  private mapPermisos(permisos?: Partial<Record<PermisoUsuario, boolean>>) {
    const result: Record<string, string> = {};
    for (const key of PERMISOS_USUARIO) {
      result[key] = permisos?.[key] ? '1' : '0';
    }
    return result;
  }

  async create(dto: CreateUserDto): Promise<Users> {
    const existing = await this.usersRepository.findOne({
      where: { usuario: dto.usuario },
    });
    if (existing) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const hashedPass = await bcrypt.hash(dto.pass, BCRYPT_ROUNDS);

    const nuevoUsuario = this.usersRepository.create({
      idEmpleado: dto.idEmpleado,
      usuario: dto.usuario,
      pass: hashedPass,
      idLicencia: dto.idLicencia,
      admin: dto.admin ? '1' : '0',
      estado: EstadoActivoInactivoEliminado.ACTIVO,
      ...this.mapPermisos(dto.permisos),
    } as Partial<Users>);

    return this.usersRepository.save(nuevoUsuario);
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
