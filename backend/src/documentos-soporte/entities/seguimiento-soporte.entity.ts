import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('seguimiento_soporte')
export class SeguimientoSoporte {
  @PrimaryColumn({ name: 'ID', type: 'int' })
  id: number;

  @Column({ name: 'ID_SOPORTE', type: 'int' })
  idSoporte: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'date' })
  hora: string;

  @Column({ name: 'MENSAJE', type: 'text' })
  mensaje: string;

  @Column({ name: 'TIPO_MENSAJE', type: 'set', enum: ['PREGUNTA', 'RESPUESTA'] })
  tipoMensaje: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
