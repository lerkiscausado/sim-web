import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('registros')
export class Registros {
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

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @Column({ name: 'TIPO_REGISTRO', type: 'char', length: 50 })
  tipoRegistro: string;

  @Column({ name: 'NOTA', type: 'text' })
  nota: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
