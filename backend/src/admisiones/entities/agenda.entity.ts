import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ordenes } from './ordenes.entity';
import { Especialistas } from '../../seguridad/entities/especialistas.entity';
import { Empleados } from '../../seguridad/entities/empleados.entity';
import { Usuarios } from '../../pacientes/entities/usuarios.entity';
import { TipoEstudio } from '../../catalogos/entities/tipo-estudio.entity';
import { Contratos } from '../../entidades-contratos/entities/contratos.entity';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

export enum EstadoAgenda {
  CANCELADA = 'CANCELADA',
  ATENDIDA = 'ATENDIDA',
  APARTADA = 'APARTADA',
  DISPONIBLE = 'DISPONIBLE',
}

@Entity('agenda')
export class Agenda {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'FECHA_AGENDA', type: 'date' })
  fechaAgenda: string;

  @Column({ name: 'FECHA_SOLICITADA', type: 'date' })
  fechaSolicitada: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  // Paciente (tabla usuarios) al que pertenece la cita.
  @Column({ name: 'ID_USUARIO', type: 'int', nullable: true })
  idUsuario?: number | null;

  @ManyToOne(() => Usuarios, { nullable: true })
  @JoinColumn({ name: 'ID_USUARIO' })
  paciente?: Usuarios | null;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @ManyToOne(() => TipoEstudio)
  @JoinColumn({ name: 'ID_TIPO_ESTUDIO' })
  tipoEstudio?: TipoEstudio;

  @Column({ name: 'ID_CONTRATO', type: 'int' })
  idContrato: number;

  @ManyToOne(() => Contratos)
  @JoinColumn({ name: 'ID_CONTRATO' })
  contrato?: Contratos;

  @Column({ name: 'NOTA', type: 'text', nullable: true })
  nota?: string | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int', nullable: true })
  idEmpleado?: number | null;

  @ManyToOne(() => Empleados, { nullable: true })
  @JoinColumn({ name: 'ID_EMPLEADO' })
  empleado?: Empleados | null;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @ManyToOne(() => Especialistas)
  @JoinColumn({ name: 'ID_ESPECIALISTA' })
  especialista?: Especialistas;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @ManyToOne(() => Ordenes)
  @JoinColumn({ name: 'ID_ORDEN' })
  orden?: Ordenes;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoAgenda, transformer: setColumnTransformer })
  estado: EstadoAgenda;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 10 })
  codigoCups: string;

  @Column({ name: 'NOMBRE_CUPS', type: 'char', length: 150 })
  nombreCups: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
