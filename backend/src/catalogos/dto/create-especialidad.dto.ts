import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEspecialidadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombreEspecialidad: string;
}
