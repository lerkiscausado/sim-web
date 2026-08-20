import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO simplificado para agregar una línea (procedimiento) al detalle de una
 * orden. Replica el comportamiento REAL del formulario VB.NET (frmOrdenes.vb,
 * GuardarDetalleOrden()): la mayoría de los campos RIPS de detalle_orden NO
 * son seleccionables en pantalla — se guardan con valores fijos por código
 * (IdCausa=15, IdFinalidadConsulta=10, IdFinalidadProcedimiento=1,
 * IdPersonaAtiende=1, IdTipoDiagnostico=1, IdFormaRealizacion=1,
 * Diagnostico1-4 en blanco). El único campo RIPS que sí es un select real en
 * el formulario es "Ámbito del Procedimiento".
 */
export class CreateDetalleOrdenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigoCups: string;

  /** Único campo RIPS seleccionable en el formulario real ("Ámbito del Procedimiento"). */
  @IsInt()
  idAmbito: number;

  @IsInt()
  idTipoEstudio: number;

  @IsIn(['C', 'P', 'U', 'H', 'M', 'A', 'O'])
  tipo: string;

  /** Si no se envía, se calcula automáticamente contra detalle_tarifa (tarifa del contrato de la orden + CUPS). */
  @IsOptional()
  @IsInt()
  valor?: number;

  @IsOptional()
  @IsInt()
  copago?: number;
}
