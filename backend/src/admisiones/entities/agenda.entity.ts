import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ name: 'ID_USUARIO', type: 'int', nullable: true })
  idUsuario?: number | null;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @Column({ name: 'ID_CONTRATO', type: 'int' })
  idContrato: number;

  @Column({ name: 'NOTA', type: 'text', nullable: true })
  nota?: string | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int', nullable: true })
  idEmpleado?: number | null;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ESTADO', type: 'set', enum: ['CANCELADA', 'ATENDIDA', 'APARTADA', 'DISPONIBLE'] })
  estado: string;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 10 })
  codigoCups: string;

  @Column({ name: 'NOMBRE_CUPS', type: 'char', length: 150 })
  nombreCups: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
