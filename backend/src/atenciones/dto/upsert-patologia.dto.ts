import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Campos del formulario frmPatologiaCD (licencia 16). En la BD se conservan
 * los nombres de columna históricos, pero su significado en CD es:
 * - descripcionMacroscopica → "Impresión Diagnóstica" (texto corto)
 * - descripcionMicroscopica → "Resultado" (NEGATIVO / POSITIVO)
 * - diagnostico             → "Descripción del Estudio" (HTML enriquecido)
 * - tipoMuestra             → nombre del espécimen elegido (cboEspecimen.Text)
 */
export class UpsertPatologiaDto {
  @IsInt()
  idOrden: number;

  @IsString()
  @IsNotEmpty({ message: 'El espécimen (tipo de muestra) es obligatorio' })
  @MaxLength(100)
  tipoMuestra: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  sitioLesion?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  solicitado?: string;

  @IsString()
  @IsOptional()
  descripcionMacroscopica?: string;

  @IsString()
  @IsOptional()
  @IsIn(['', 'NEGATIVO', 'POSITIVO'])
  descripcionMicroscopica?: string;

  @IsString()
  @IsOptional()
  diagnostico?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  /** Código CIE10 (tabla diagnosticos). Obligatorio solo para firmar. */
  @IsString()
  @IsOptional()
  @MaxLength(12)
  codigoDiagnostico?: string;

  /** Espécimen final (actualiza también ordenes.ID_ESPECIMEN, igual que _dOrdenes.ActualizarEspecimen). */
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
