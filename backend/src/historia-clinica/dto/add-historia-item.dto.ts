import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddHistoriaDiagnosticoDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  /** Código CIE10 (tabla diagnosticos). */
  @IsString()
  @IsNotEmpty()
  idDiagnostico: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class AddHistoriaMedicamentoDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsInt()
  idMedicamento: number;

  @IsInt()
  idViaAdministracion: number;

  @IsString()
  @IsNotEmpty()
  dosis: string;

  @IsString()
  @IsNotEmpty()
  cantidad: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;
}

export class AddHistoriaLaboratorioDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  /** Código CUPS del examen (la tabla real lo guarda como número). */
  @IsString()
  @IsNotEmpty()
  codigoCups: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class AddHistoriaProcedimientoDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsString()
  @IsNotEmpty()
  codigoCups: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;
}

export class AddHistoriaRxsDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsInt()
  idRxs: number;

  @IsString()
  @IsNotEmpty()
  descripcion: string;
}
