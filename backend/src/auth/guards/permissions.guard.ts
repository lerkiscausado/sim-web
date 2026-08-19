import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { PermisoUsuario } from '../../seguridad/constants/permisos';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<PermisoUsuario>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (user?.admin) {
      return true;
    }
    if (!user?.permisos?.[requiredPermission]) {
      throw new ForbiddenException(
        `No tienes el permiso requerido: ${requiredPermission}`,
      );
    }
    return true;
  }
}
