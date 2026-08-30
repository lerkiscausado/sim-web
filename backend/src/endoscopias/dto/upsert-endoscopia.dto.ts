import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertEndoscopiaDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsDateString()
  fechaEstudio: string;

  @IsOptional()
  @IsDateString()
  fechaSalida?: string;

  @IsString()
  @IsNotEmpty()
  medicoSolicita: string;

  @IsString()
  @IsNotEmpty()
  indicacion: string;

  @IsOptional()
  @IsString()
  medicamentos?: string;

  @IsInt()
  idEquipo: number;

  @IsInt()
  idProcedimientoTerapeutico: number;

  @IsOptional()
  @IsString()
  anestesiologo?: string;

  /** Reporte del procedimiento (plantilla precargada según el tipo de estudio). */
  @IsString()
  @IsNotEmpty()
  campo1: string;

  @IsOptional()
  @IsString()
  campo6?: string;

  @IsString()
  @IsNotEmpty()
  diagnostico: string;

  @IsOptional()
  @IsString()
  codigoDiagnostico?: string;
}
