import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateEspecimenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombre: string;
}
