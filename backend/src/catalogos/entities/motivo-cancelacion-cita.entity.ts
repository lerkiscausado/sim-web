import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('motivo_cancelacion_cita')
export class MotivoCancelacionCita {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'DESCRIPCION', type: 'char', length: 100 })
  descripcion: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
