import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  usuario: string;
  idEmpleado: number;
  admin: boolean;
  permisos: Record<string, boolean>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      usuario: payload.usuario,
      idEmpleado: payload.idEmpleado,
      admin: payload.admin,
      permisos: payload.permisos,
    };
  }
}
