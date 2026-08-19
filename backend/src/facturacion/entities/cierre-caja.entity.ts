import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('cierre_caja')
export class CierreCaja {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'SALDO', type: 'double' })
  saldo: number;

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
