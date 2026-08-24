import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

const SINO = ['1', '0'];

export class UpsertTomaMuestraDto {
  @IsInt()
  idUsuario: number;

  @IsOptional() @IsString() g?: string;
  @IsOptional() @IsString() p?: string;
  @IsOptional() @IsString() a?: string;
  @IsOptional() @IsString() c?: string;
  @IsOptional() @IsString() ivsa?: string;
  @IsOptional() @IsString() mpf?: string;
  @IsOptional() @IsString() fum?: string;
  @IsOptional() @IsString() fuc?: string;
  @IsOptional() @IsString() fup?: string;

  @IsOptional() @IsIn(SINO) s?: string;
  @IsOptional() @IsIn(SINO) u?: string;
  @IsOptional() @IsIn(SINO) l?: string;
  @IsOptional() @IsIn(SINO) bn?: string;
  @IsOptional() @IsIn(SINO) cn?: string;
  @IsOptional() @IsIn(SINO) ba?: string;
  @IsOptional() @IsIn(SINO) o?: string;

  @IsOptional() @IsString() observaciones?: string;
}
