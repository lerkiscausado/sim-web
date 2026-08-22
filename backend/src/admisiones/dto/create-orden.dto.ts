import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleOrdenDto } from './create-detalle-orden.dto';

export class CreateOrdenDto {
  @IsInt()
  idUsuario: number;

  @IsInt()
  idContrato: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroOrden?: string;

  @IsInt()
  idSubentidad: number;

  @IsInt()
  idIngreso: number;

  @IsInt()
  idSede: number;

  /** "Médico" en el formulario VB.NET — campo real seleccionable, referencia a empleados. */
  @IsInt()
  idEmpleado: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  autorizacion?: string;

  @IsOptional()
  @IsDateString()
  fechaOrden?: string;

  @IsInt()
  idTipoAfiliado: number;

  @IsInt()
  idTipoUsuario: number;

  @IsInt()
  idTipoEstudio: number;

  @IsInt()
  idEspecimen: number;

  @IsOptional()
  @IsString()
  comentarios?: string;

  /** Estudios (procedimientos) a registrar junto con la orden, en una sola operación. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenDto)
  detalles?: CreateDetalleOrdenDto[];
}
