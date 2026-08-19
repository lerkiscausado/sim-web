import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PermisoUsuario } from '../constants/permisos';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  usuario?: string;

  /** Si viene, se re-hashea. Si se omite, la clave actual no se toca. */
  @IsOptional()
  @IsString()
  @MinLength(6)
  pass?: string;

  @IsOptional()
  @IsBoolean()
  admin?: boolean;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsObject()
  permisos?: Partial<Record<PermisoUsuario, boolean>>;
}
