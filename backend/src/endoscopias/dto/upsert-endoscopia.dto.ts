import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertEndoscopiaDto {
  @IsInt()
  idOrden: number;

  @IsInt()
  idDetalleOrden: number;

  @IsDateString()
  fechaEstudio: string;

  @IsOptional()
  @IsDateString()
  fechaSalida?: string;

  @IsString()
  @IsNotEmpty()
  medicoSolicita: string;

  @IsString()
  @IsNotEmpty()
  indicacion: string;

  @IsOptional()
  @IsString()
  medicamentos?: string;

  @IsInt()
  idEquipo: number;

  @IsInt()
  idProcedimientoTerapeutico: number;

  @IsOptional()
  @IsString()
  anestesiologo?: string;

  /** Descripción del procedimiento. */
  @IsString()
  @IsNotEmpty()
  campo1: string;

  /** Pestañas según el tipo (frmEndoscopiaGL): Esófago/Estómago/Duodeno o Inspección/Tacto/Colonoscopia|Rectoscopia. */
  @IsOptional() @IsString() campo2?: string;
  @IsOptional() @IsString() campo3?: string;
  @IsOptional() @IsString() campo4?: string;

  /** ELCB (solo colonoscopia). El escritorio guarda "." cuando no aplica. */
  @IsOptional() @IsString() campo5?: string;

  /** Nombre del CUPS (el escritorio lo guarda aquí). */
  @IsOptional()
  @IsString()
  campo6?: string;

  @IsOptional() @IsIn(['NO', 'SI']) tomaBiopsia?: 'NO' | 'SI';
  @IsOptional() @IsString() biopsia?: string;

  @IsString()
  @IsNotEmpty()
  diagnostico: string;

  /** CIE-10 (la columna es CHAR(4)). */
  @IsOptional()
  @IsString()
  @MaxLength(4)
  codigoDiagnostico?: string;
}
