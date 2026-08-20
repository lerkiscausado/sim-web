import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('toma_muestra')
export class TomaMuestra {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @Column({ name: 'G', type: 'char', length: 2 })
  g: string;

  @Column({ name: 'P', type: 'char', length: 2 })
  p: string;

  @Column({ name: 'A', type: 'char', length: 2 })
  a: string;

  @Column({ name: 'C', type: 'char', length: 2 })
  c: string;

  @Column({ name: 'IVSA', type: 'char', length: 20 })
  ivsa: string;

  @Column({ name: 'MPF', type: 'char', length: 20 })
  mpf: string;

  @Column({ name: 'FUM', type: 'char', length: 20 })
  fum: string;

  @Column({ name: 'FUC', type: 'char', length: 20 })
  fuc: string;

  @Column({ name: 'FUP', type: 'char', length: 20 })
  fup: string;

  @Column({ name: 'S', type: 'enum', enum: ['1', '0'] })
  s: string;

  @Column({ name: 'U', type: 'enum', enum: ['1', '0'] })
  u: string;

  @Column({ name: 'L', type: 'enum', enum: ['1', '0'] })
  l: string;

  @Column({ name: 'BN', type: 'enum', enum: ['1', '0'] })
  bn: string;

  @Column({ name: 'CN', type: 'enum', enum: ['1', '0'] })
  cn: string;

  @Column({ name: 'BA', type: 'enum', enum: ['1', '0'] })
  ba: string;

  @Column({ name: 'O', type: 'enum', enum: ['1', '0'] })
  o: string;

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
