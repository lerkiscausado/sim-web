import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

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

  @Type(() => Number)
  @IsInt()
  codigoTipoUsuario: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  carnet?: string;

  // ── Datos que exige el RDA (MinSalud) ──
  @IsOptional() @IsString() @MaxLength(5) codigoPaisNacimiento?: string;
  @IsOptional() @IsString() @MaxLength(5) codigoEtnia?: string;
  @IsOptional() @IsString() @MaxLength(5) codigoDiscapacidad?: string;
  @IsOptional() @IsString() @MaxLength(5) codigoIdentidadGenero?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, { message: 'La hora de nacimiento debe tener formato HH:MM.' })
  horaNacimiento?: string;

  @IsOptional() @IsString() @MaxLength(120) nombreMunicipio?: string;
}
