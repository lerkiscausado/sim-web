import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'ID_DOCUMENTO', type: 'int' })
  idDocumento: number;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'MOVIMIENTO', type: 'set', enum: ['E', 'S', 'C', 'D'], transformer: setColumnTransformer })
  movimiento: string;

  @Column({ name: 'FACTURA', type: 'char', length: 50 })
  factura: string;

  @Column({ name: 'OBSERVACION', type: 'text', nullable: true })
  observacion?: string | null;

  @Column({ name: 'ENTRADA_CANTIDAD', type: 'int' })
  entradaCantidad: number;

  @Column({ name: 'ENTRADA_VALOR', type: 'double' })
  entradaValor: number;

  @Column({ name: 'SALIDA_CANTIDAD', type: 'int' })
  salidaCantidad: number;

  @Column({ name: 'SALIDA_VALOR', type: 'double' })
  salidaValor: number;

  @Column({ name: 'SALDO_CANTIDAD', type: 'int' })
  saldoCantidad: number;

  @Column({ name: 'SALDO_TOTAL', type: 'double' })
  saldoTotal: number;

  @Column({ name: 'VALOR_PROMEDIO', type: 'double' })
  valorPromedio: number;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
