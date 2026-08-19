import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  idTipoIdentificacion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  identificacion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  primerNombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  segundoNombre?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  primerApellido: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  segundoApellido?: string;

  @IsIn(['M', 'F'])
  sexo: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  ciudadNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paisNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(750)
  correoElectronico?: string;

  @IsIn(['CASADO', 'SOLTERO', 'DIVORCIADO', 'VIUDO', 'UNION LIBRE'])
  estadoCivil: string;

  @IsOptional()
  @IsIn(['R', 'U'])
  zona?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  codigoMunicipio?: string;

  @IsInt()
  codigoTipoUsuario: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  carnet?: string;
}
