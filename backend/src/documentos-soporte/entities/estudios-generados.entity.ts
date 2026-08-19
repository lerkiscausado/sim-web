import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ordenes } from '../../admisiones/entities/ordenes.entity';
import { DetalleOrden } from '../../admisiones/entities/detalle-orden.entity';
import { Empleados } from '../../seguridad/entities/empleados.entity';

@Entity('estudios_generados')
export class EstudiosGenerados {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @ManyToOne(() => Ordenes)
  @JoinColumn({ name: 'ID_ORDEN' })
  orden?: Ordenes;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @ManyToOne(() => DetalleOrden)
  @JoinColumn({ name: 'ID_DETALLE_ORDEN' })
  detalleOrden?: DetalleOrden;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'ESTUDIO', type: 'char', length: 100 })
  estudio: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @ManyToOne(() => Empleados)
  @JoinColumn({ name: 'ID_EMPLEADO' })
  empleado?: Empleados;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
