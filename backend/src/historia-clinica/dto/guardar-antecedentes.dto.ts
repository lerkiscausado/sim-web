import { IsInt, IsOptional, IsString } from 'class-validator';

/** Antecedentes de la orden (tabla `antecedentes`): texto libre, como en el escritorio. */
export class GuardarAntecedentesDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idUsuario: number;

  @IsOptional() @IsString() familiares?: string;
  @IsOptional() @IsString() personales?: string;
}
