import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('compras')
export class Compras {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time', nullable: true })
  hora?: string | null;

  @Column({ name: 'ID_ORDEN_COMPRA', type: 'int' })
  idOrdenCompra: number;

  @Column({ name: 'CONCEPTO', type: 'text', nullable: true })
  concepto?: string | null;

  @Column({ name: 'FACTURA', type: 'char', length: 50, nullable: true })
  factura?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'FECHA_CONFIRMACION', type: 'date', nullable: true })
  fechaConfirmacion?: string | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
