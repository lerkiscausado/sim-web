import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCupsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigoCups: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  nombreCups: string;
}
