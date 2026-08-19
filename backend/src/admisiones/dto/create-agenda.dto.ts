import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAgendaDto {
  @IsDateString()
  fecha: string;

  @IsDateString()
  fechaAgenda: string;

  @IsDateString()
  fechaSolicitada: string;

  /** Formato HH:mm:ss */
  @IsString()
  @IsNotEmpty()
  hora: string;

  @IsOptional()
  @IsInt()
  idUsuario?: number;

  @IsInt()
  idTipoEstudio: number;

  @IsInt()
  idContrato: number;

  @IsOptional()
  @IsString()
  nota?: string;

  @IsOptional()
  @IsInt()
  idEmpleado?: number;

  @IsInt()
  idEspecialista: number;

  @IsInt()
  idOrden: number;

  @IsString()
  @IsNotEmpty()
  codigoCups: string;

  @IsString()
  @IsNotEmpty()
  nombreCups: string;
}
