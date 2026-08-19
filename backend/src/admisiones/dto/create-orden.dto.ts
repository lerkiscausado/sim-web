import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrdenDto {
  @IsInt()
  idUsuario: number;

  @IsInt()
  idContrato: number;

  @IsInt()
  idSubentidad: number;

  @IsInt()
  idIngreso: number;

  @IsInt()
  idSede: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  autorizacion?: string;

  @IsOptional()
  @IsDateString()
  fechaOrden?: string;

  @IsInt()
  idTipoAfiliado: number;

  @IsInt()
  idTipoUsuario: number;

  @IsInt()
  idTipoEstudio: number;

  @IsInt()
  idEspecimen: number;

  @IsOptional()
  @IsString()
  comentarios?: string;
}
