import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertPatologiaDto {
  @IsInt()
  idOrden: number;

  @IsString()
  @IsNotEmpty()
  tipoMuestra: string;

  @IsString()
  @IsNotEmpty()
  sitioLesion: string;

  @IsString()
  @IsNotEmpty()
  solicitado: string;

  @IsString()
  descripcionMacroscopica: string;

  @IsString()
  descripcionMicroscopica: string;

  @IsString()
  diagnostico: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  /** Código CIE10 (tabla diagnosticos) */
  @IsString()
  @IsNotEmpty()
  codigoDiagnostico: string;

  /** Espécimen final tomado (actualiza también ordenes.ID_ESPECIMEN, igual que el VB.NET original) */
  @IsInt()
  @IsOptional()
  idEspecimen?: number;

  @IsString()
  @IsOptional()
  codigoPatologia?: string;

  /** Editable por el usuario; si no se envía, se usa la fecha de hoy. */
  @IsDateString()
  @IsOptional()
  fechaSalida?: string;
}
