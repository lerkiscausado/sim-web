import { IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertHistoriaClinicaDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsOptional() @IsString() responsables?: string;
  @IsOptional() @IsString() motivoConsulta?: string;
  @IsOptional() @IsString() consultaControl?: string;
  @IsOptional() @IsString() enfermedadActual?: string;
  @IsOptional() @IsString() examenFisico?: string;
  @IsOptional() @IsNumber() peso?: number;
  @IsOptional() @IsNumber() talla?: number;
  @IsOptional() @IsString() tensionArterial?: string;
  @IsOptional() @IsString() frecuenciaCardiaca?: string;
  @IsOptional() @IsString() frecuenciaRespiratoria?: string;
  @IsOptional() @IsString() temperatura?: string;
  @IsOptional() @IsString() diagnostico?: string;
  @IsOptional() @IsString() planSeguir?: string;
  @IsOptional() @IsString() formulacion?: string;
  @IsOptional() @IsString() laboratorios?: string;
  @IsOptional() @IsString() otrosEstudios?: string;
  @IsOptional() @IsString() recomendaciones?: string;
  @IsOptional() @IsString() revisionxSistemas?: string;
  @IsOptional() @IsString() remision?: string;
  @IsOptional() @IsString() estudiosDiagnosticos?: string;

  // El estado (ESTADO, firmada) ya no lo manda el cliente: solo cambia al firmar
  // (PATCH .../firmar), por la Resolución 3100.
}
