import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('detalle_compra')
export class DetalleCompra {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_COMPRA', type: 'char', length: 50 })
  idCompra: string;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'CANTIDAD', type: 'int', nullable: true })
  cantidad?: number | null;

  @Column({ name: 'VALOR_UNITARIO', type: 'double', nullable: true })
  valorUnitario?: number | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
