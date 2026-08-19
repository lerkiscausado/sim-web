import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'ID_TABLA', type: 'int' })
  idTabla: number;

  @Column({ name: 'ID_REGISTRO', type: 'int' })
  idRegistro: number;

  @Column({ name: 'CONCEPTO', type: 'text' })
  concepto: string;

  @Column({ name: 'COMENTARIO', type: 'text' })
  comentario: string;

  @Column({ name: 'ID_SOLICITA', type: 'int' })
  idSolicita: number;

  @Column({ name: 'ID_AUTORIZA', type: 'int' })
  idAutoriza: number;

  @Column({ name: 'ESTADO', type: 'set', enum: ['ABIERTA', 'CERRADA'] })
  estado: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
