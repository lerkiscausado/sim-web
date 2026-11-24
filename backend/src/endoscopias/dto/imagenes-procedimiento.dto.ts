import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ActualizarImagenDto {
  @IsOptional() @IsBoolean() enInforme?: boolean;
  @IsOptional() @IsString() @MaxLength(100) texto?: string;
}

export class OrdenarImagenesDto {
  @IsArray() @ArrayMaxSize(9) @IsInt({ each: true }) ids: number[];
}
