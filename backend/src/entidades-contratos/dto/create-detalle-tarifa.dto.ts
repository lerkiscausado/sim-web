import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateDetalleTarifaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigoCups: string;

  @IsInt()
  idTipoEstudio: number;

  @IsInt()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  descuento?: number;

  @IsIn(['CONSULTA', 'PROCEDIMIENTO'])
  tipoAtencion: string;
}
