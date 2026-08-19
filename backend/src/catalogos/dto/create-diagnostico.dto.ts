import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDiagnosticoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigoDiagnostico: string;

  @IsOptional()
  @IsString()
  @MaxLength(900)
  nombreDiagnostico?: string;
}
