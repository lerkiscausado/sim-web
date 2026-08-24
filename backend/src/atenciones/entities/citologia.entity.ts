import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Ordenes } from '../../admisiones/entities/ordenes.entity';

@Entity('citologia')
export class Citologia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @ManyToOne(() => Ordenes)
  @JoinColumn({ name: 'ID_ORDEN' })
  orden?: Ordenes;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'CM_1', type: 'char', length: 1, nullable: true })
  cm1?: string | null;

  @Column({ name: 'CM_2', type: 'char', length: 1, nullable: true })
  cm2?: string | null;

  @Column({ name: 'CM_3', type: 'char', length: 1, nullable: true })
  cm3?: string | null;

  @Column({ name: 'CM_4', type: 'char', length: 1, nullable: true })
  cm4?: string | null;

  @Column({ name: 'CM_5', type: 'text', nullable: true })
  cm5?: string | null;

  @Column({ name: 'CG_1', type: 'char', length: 1, nullable: true })
  cg1?: string | null;

  @Column({ name: 'CG_2', type: 'char', length: 1, nullable: true })
  cg2?: string | null;

  @Column({ name: 'M_1', type: 'char', length: 1, nullable: true })
  m1?: string | null;

  @Column({ name: 'M_2', type: 'char', length: 1, nullable: true })
  m2?: string | null;

  @Column({ name: 'M_3', type: 'char', length: 1, nullable: true })
  m3?: string | null;

  @Column({ name: 'M_4', type: 'char', length: 1, nullable: true })
  m4?: string | null;

  @Column({ name: 'M_5', type: 'char', length: 1, nullable: true })
  m5?: string | null;

  @Column({ name: 'M_6', type: 'char', length: 1, nullable: true })
  m6?: string | null;

  @Column({ name: 'OHNN_1', type: 'char', length: 1, nullable: true })
  ohnn1?: string | null;

  @Column({ name: 'OHNN_2', type: 'char', length: 1, nullable: true })
  ohnn2?: string | null;

  @Column({ name: 'OHNN_3', type: 'char', length: 1, nullable: true })
  ohnn3?: string | null;

  @Column({ name: 'OHNN_4', type: 'char', length: 1, nullable: true })
  ohnn4?: string | null;

  @Column({ name: 'OHNN_5', type: 'char', length: 1, nullable: true })
  ohnn5?: string | null;

  @Column({ name: 'OHNN_6', type: 'char', length: 1, nullable: true })
  ohnn6?: string | null;

  @Column({ name: 'ACE_1', type: 'char', length: 1, nullable: true })
  ace1?: string | null;

  @Column({ name: 'ACE_2', type: 'char', length: 1, nullable: true })
  ace2?: string | null;

  @Column({ name: 'ACE_3', type: 'char', length: 1, nullable: true })
  ace3?: string | null;

  @Column({ name: 'ACE_4', type: 'char', length: 1, nullable: true })
  ace4?: string | null;

  @Column({ name: 'ACE_5', type: 'char', length: 1, nullable: true })
  ace5?: string | null;

  @Column({ name: 'ACG_1', type: 'char', length: 1, nullable: true })
  acg1?: string | null;

  @Column({ name: 'ACG_2', type: 'char', length: 1, nullable: true })
  acg2?: string | null;

  @Column({ name: 'ACG_3', type: 'char', length: 1, nullable: true })
  acg3?: string | null;

  @Column({ name: 'ACG_4', type: 'char', length: 1, nullable: true })
  acg4?: string | null;

  @Column({ name: 'ACG_5', type: 'char', length: 1, nullable: true })
  acg5?: string | null;

  @Column({ name: 'ACG_6', type: 'char', length: 1, nullable: true })
  acg6?: string | null;

  @Column({ name: 'ACG_7', type: 'char', length: 1, nullable: true })
  acg7?: string | null;

  @Column({ name: 'ACG_8', type: 'char', length: 1, nullable: true })
  acg8?: string | null;

  @Column({ name: 'FB_1', type: 'char', length: 1 })
  fb1: string;

  @Column({ name: 'FB_2', type: 'char', length: 1 })
  fb2: string;

  @Column({ name: 'FB_3', type: 'char', length: 1 })
  fb3: string;

  @Column({ name: 'I_1', type: 'char', length: 1 })
  i1: string;

  @Column({ name: 'I_2', type: 'char', length: 1 })
  i2: string;

  @Column({ name: 'I_3', type: 'char', length: 1 })
  i3: string;

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'IMG1', type: 'varchar', length: 150 })
  img1: string;

  @Column({ name: 'IMG2', type: 'varchar', length: 150 })
  img2: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
