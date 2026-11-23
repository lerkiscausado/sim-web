import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddAdendaDto {
  @IsString()
  @IsNotEmpty({ message: 'El texto de la adenda es obligatorio.' })
  @MaxLength(20000)
  texto: string;
}
