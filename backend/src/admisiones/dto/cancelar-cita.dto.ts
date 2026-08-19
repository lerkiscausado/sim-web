import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CancelarCitaDto {
  @IsInt()
  idMotivo: number;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}
