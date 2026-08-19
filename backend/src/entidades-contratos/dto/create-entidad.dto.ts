import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEntidadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigoEntidad: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombreEntidad: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;
}
