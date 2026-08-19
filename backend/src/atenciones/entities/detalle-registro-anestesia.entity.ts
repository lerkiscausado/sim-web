import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_registro_anestesia')
export class DetalleRegistroAnestesia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_REGISTRO_ANESTESIA', type: 'char', length: 50 })
  idRegistroAnestesia: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'O2', type: 'char', length: 50 })
  o2: string;

  @Column({ name: 'ANESTESIA', type: 'char', length: 50 })
  anestesia: string;

  @Column({ name: 'PULSO', type: 'char', length: 50 })
  pulso: string;

  @Column({ name: 'RESPIRACION', type: 'char', length: 50 })
  respiracion: string;

  @Column({ name: 'DIURESIS', type: 'char', length: 50 })
  diuresis: string;

  @Column({ name: 'PA_X', type: 'char', length: 50 })
  paX: string;

  @Column({ name: 'PVC', type: 'char', length: 50 })
  pvc: string;

  @Column({ name: 'V', type: 'char', length: 50 })
  v: string;

  @Column({ name: 'SAT_O', type: 'char', length: 50 })
  satO: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
