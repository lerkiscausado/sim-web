import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContratoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  codigoEntidad: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroContrato?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsDateString()
  fechaFinal: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  contacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  correoElectronico?: string;

  @IsIn(['EVENTO', 'CAPITADO', 'PAQUETE'])
  tipoContrato: string;

  @IsIn(['SI', 'NO'])
  rips: string;

  @IsOptional()
  @IsInt()
  idTarifa?: number;

  @IsOptional()
  @IsInt()
  valorConvenio?: number;

  @IsInt()
  idLicencia: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  usuario: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  contrasena: string;
}
