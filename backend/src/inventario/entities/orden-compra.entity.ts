import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('orden_compra')
export class OrdenCompra {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'ID_PROVEEDOR', type: 'int' })
  idProveedor: number;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'OBSERVACION', type: 'text', nullable: true })
  observacion?: string | null;

  @Column({ name: 'ESTADO', type: 'enum', enum: ['ABIERTA', 'APROBADA', 'PARCIAL', 'CERRADA', 'ANULADA'] })
  estado: string;

  @Column({ name: 'FECHA_APROBACION', type: 'date' })
  fechaAprobacion: string;

  @Column({ name: 'ID_APROBACION', type: 'int', nullable: true })
  idAprobacion?: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
