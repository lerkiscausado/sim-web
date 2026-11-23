import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** Identificación y nombre estructurado que exige PractitionerRDA (deben coincidir con RETHUS). */
export class ActualizarEspecialistaRdaDto {
  @IsIn(['CC', 'CE', 'PA', 'PT', 'PE', 'TI', 'DE'])
  idTipoIdentificacion: string;

  @IsString()
  @Matches(/^[A-Za-z0-9]{3,20}$/, { message: 'La identificación solo admite letras y números (3 a 20).' })
  identificacion: string;

  @IsString() @IsNotEmpty() @MaxLength(60) primerNombre: string;
  @IsOptional() @IsString() @MaxLength(60) segundoNombre?: string;
  @IsString() @IsNotEmpty() @MaxLength(60) primerApellido: string;
  @IsOptional() @IsString() @MaxLength(60) segundoApellido?: string;
}
