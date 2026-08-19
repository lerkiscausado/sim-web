import { SetMetadata } from '@nestjs/common';
import { PermisoUsuario } from '../../seguridad/constants/permisos';

export const PERMISSION_KEY = 'permission';

/**
 * Exige que el usuario autenticado tenga en TRUE el permiso indicado
 * (columna real de la tabla `users`, ej: 'agenda', 'facturacion', 'inventario').
 * Un usuario con admin = true pasa siempre, sin importar el permiso puntual.
 */
export const RequirePermission = (permission: PermisoUsuario) =>
  SetMetadata(PERMISSION_KEY, permission);
