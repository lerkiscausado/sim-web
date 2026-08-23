import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTarifaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreTarifa: string;
}
