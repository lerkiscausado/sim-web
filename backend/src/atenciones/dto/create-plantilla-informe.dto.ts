import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePlantillaInformeDto {
  @IsInt()
  idTipoEstudio: number;

  @IsInt()
  idEspecialista: number;

  @IsOptional()
  @IsString()
  campo1?: string;

  @IsOptional()
  @IsString()
  campo2?: string;

  @IsOptional()
  @IsString()
  campo3?: string;

  @IsOptional()
  @IsString()
  campo4?: string;

  @IsOptional()
  @IsString()
  campo5?: string;

  @IsOptional()
  @IsString()
  campo6?: string;
}
