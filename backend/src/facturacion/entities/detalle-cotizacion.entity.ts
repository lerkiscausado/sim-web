import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('detalle_cotizacion')
export class DetalleCotizacion {
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

  @Column({ name: 'ESTADO', type: 'set', enum: ['ANULADO', 'FACTURADO'], transformer: setColumnTransformer })
  estado: string;

  @Column({ name: 'ID_COTIZACION', type: 'char', length: 50 })
  idCotizacion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
