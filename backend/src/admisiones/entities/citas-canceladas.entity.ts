import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { Agenda } from './agenda.entity';
import { MotivoCancelacionCita } from '../../catalogos/entities/motivo-cancelacion-cita.entity';

@Entity('citas_canceladas')
export class CitasCanceladas {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'ID_AGENDA', type: 'int' })
  idAgenda: number;

  @ManyToOne(() => Agenda)
  @JoinColumn({ name: 'ID_AGENDA' })
  agenda?: Agenda;

  @Column({ name: 'ID_MOTIVO', type: 'int' })
  idMotivo: number;

  @ManyToOne(() => MotivoCancelacionCita)
  @JoinColumn({ name: 'ID_MOTIVO' })
  motivoCancelacion?: MotivoCancelacionCita;

  @Column({ name: 'MOTIVO', type: 'char', length: 100 })
  motivo: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
