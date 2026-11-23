import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class ActualizarConfigRdaDto {
  @IsOptional() @IsIn(['SANDBOX', 'PRODUCCION']) ambiente?: string;
  @IsOptional() @IsString() @MaxLength(100) tenantId?: string;
  @IsOptional() @IsString() @MaxLength(100) clientId?: string;
  /** Solo se envía para cambiarlo; vacío = conservar el actual. Nunca se devuelve. */
  @IsOptional() @IsString() @MaxLength(255) clientSecret?: string;
  @IsOptional() @IsString() @MaxLength(100) subscriptionKey?: string;
  @IsOptional() @IsString() @MaxLength(255) @Matches(/^https:\/\//, { message: 'La URL del servidor de token debe empezar por https://' }) urlAuthServer?: string;
  @IsOptional() @IsString() @MaxLength(255) @Matches(/^https:\/\//, { message: 'La URL de la API debe empezar por https://' }) urlBaseApi?: string;
  @IsOptional() @Matches(/^\d{10}$/, { message: 'El código de habilitación (REPS) tiene 10 dígitos.' }) codigoPrestadorReps?: string;
  @IsOptional() @Matches(/^\d{6,15}$/, { message: 'El NIT va solo con números y sin dígito de verificación.' }) nitPrestador?: string;
  @IsOptional() @IsBoolean() estado?: boolean;
}
