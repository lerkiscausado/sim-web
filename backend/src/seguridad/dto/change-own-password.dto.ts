import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeOwnPasswordDto {
  @IsString()
  @IsNotEmpty()
  actual: string;

  @IsString()
  @MinLength(4)
  nueva: string;
}
