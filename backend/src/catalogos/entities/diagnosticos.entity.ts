import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('diagnosticos')
export class Diagnosticos {
  @PrimaryColumn({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 12 })
  codigoDiagnostico: string;

  @Column({ name: 'NOMBRE_DIAGNOSTICO', type: 'varchar', length: 900, nullable: true })
  nombreDiagnostico?: string | null;

  @Column({ name: 'ESTADO', type: 'char', length: 3, nullable: true })
  estado?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
