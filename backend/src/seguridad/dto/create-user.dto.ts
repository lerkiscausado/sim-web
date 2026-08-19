import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PermisoUsuario } from '../constants/permisos';

export class CreateUserDto {
  @IsInt()
  @IsNotEmpty()
  idEmpleado: number;

  @IsString()
  @IsNotEmpty()
  usuario: string;

  /** Contraseña en texto plano recibida por la API; el service la hashea con bcrypt. */
  @IsString()
  @MinLength(6)
  pass: string;

  /** '1' = administrador (todos los permisos), '0' = usuario normal */
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  /** Mapa parcial de permisos, ej: { agenda: true, facturacion: false }. Los que no vengan quedan en false. */
  @IsOptional()
  @IsObject()
  permisos?: Partial<Record<PermisoUsuario, boolean>>;
}
