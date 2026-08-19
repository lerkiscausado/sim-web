import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../seguridad/users.service';
import { LoginDto } from './dto/login.dto';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { usuario, pass } = loginDto;
    const user = await this.usersService.findOneByUsuarioWithPassword(usuario);

    if (!user) {
      throw new UnauthorizedException('Usuario o contraseña inválidos');
    }

    if (user.estado === EstadoActivoInactivoEliminado.INACTIVO) {
      throw new UnauthorizedException('El usuario está inactivo');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.pass);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Usuario o contraseña inválidos');
    }

    const permisos = this.usersService.buildPermisosMap(user);
    const isAdmin = user.admin === '1';

    const payload = {
      sub: user.id,
      usuario: user.usuario,
      idEmpleado: user.idEmpleado,
      admin: isAdmin,
      permisos,
    };

    return {
      user: {
        id: user.id,
        usuario: user.usuario,
        idEmpleado: user.idEmpleado,
        admin: isAdmin,
        permisos,
      },
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
