import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('detalle_tarifa_productos')
export class DetalleTarifaProductos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_TARIFA_PRODUCTO', type: 'char', length: 50 })
  idTarifaProducto: string;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'VALOR', type: 'int' })
  valor: number;

  @Column({ name: 'IVA', type: 'int' })
  iva: number;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
