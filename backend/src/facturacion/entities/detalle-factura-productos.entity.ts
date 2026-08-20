import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('detalle_factura_productos')
export class DetalleFacturaProductos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_FACTURA', type: 'char', length: 50 })
  idFactura: string;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'VALOR_UNITARIO', type: 'bigint' })
  valorUnitario: number;

  @Column({ name: 'IVA', type: 'bigint' })
  iva: number;

  @Column({ name: 'DESCUENTO', type: 'bigint' })
  descuento: number;

  @Column({ name: 'COSTO_VENTA', type: 'bigint' })
  costoVenta: number;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
