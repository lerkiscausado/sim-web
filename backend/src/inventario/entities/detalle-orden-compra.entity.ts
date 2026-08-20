import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_orden_compra')
export class DetalleOrdenCompra {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN_COMPRA', type: 'char', length: 50 })
  idOrdenCompra: string;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'VALOR_UNITARIO', type: 'int' })
  valorUnitario: number;

  @Column({ name: 'ESTADO', type: 'enum', enum: ['REQUERIDO', 'ASIGNADO', 'CONFIRMADO', 'PARCIAL'] })
  estado: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
