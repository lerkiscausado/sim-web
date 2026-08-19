import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMedicamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}
