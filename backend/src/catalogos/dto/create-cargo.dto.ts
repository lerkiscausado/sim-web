import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCargoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  nombreCargo: string;
}
