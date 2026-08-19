import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDetalleOrdenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigoCups: string;

  @IsInt()
  idCausa: number;

  @IsInt()
  idFinalidadConsulta: number;

  @IsInt()
  idFinalidadProcedimiento: number;

  @IsInt()
  idAmbito: number;

  @IsInt()
  idPersonaAtiende: number;

  @IsInt()
  idTipoDiagnostico: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  diagnostico1: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  diagnostico2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  diagnostico3?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  diagnostico4?: string;

  @IsInt()
  idFormaRealizacion: number;

  @IsInt()
  idTipoEstudio: number;

  @IsIn(['C', 'P', 'U', 'H', 'M', 'A', 'O'])
  tipo: string;

  /** Si no se envía, se calcula automáticamente contra detalle_tarifa (tarifa del contrato de la orden + CUPS). */
  @IsOptional()
  @IsInt()
  valor?: number;

  @IsOptional()
  @IsInt()
  copago?: number;
}
