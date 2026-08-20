import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombreEmpleado: string;

  @IsInt()
  idCargo: number;

  @IsInt()
  idEspecialidad: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  registroMedico?: string;
}
