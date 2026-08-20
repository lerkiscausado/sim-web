import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_orden_servicio')
export class DetalleOrdenServicio {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'VALOR', type: 'int' })
  valor: number;

  @Column({ name: 'IVA', type: 'int' })
  iva: number;

  @Column({ name: 'DESCUENTO', type: 'int' })
  descuento: number;

  @Column({ name: 'ESTADO', type: 'enum', enum: ['ANULADO', 'FACTURADO'] })
  estado: string;

  @Column({ name: 'ID_ORDEN_SERVICIO', type: 'char', length: 50 })
  idOrdenServicio: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
