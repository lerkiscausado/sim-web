import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePlantillaPatologiaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  macro: string;

  @IsString()
  micro: string;

  @IsString()
  diagnostico: string;
}
