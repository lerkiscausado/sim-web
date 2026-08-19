import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('percentiles')
export class Percentiles {
  @PrimaryColumn({ name: 'edad', type: 'int' })
  edad: number;

  @Column({ name: 'AMaximoM', type: 'double' })
  amaximom: number;

  @Column({ name: 'ANormalM', type: 'double' })
  anormalm: number;

  @Column({ name: 'AMinimaM', type: 'double' })
  aminimam: number;

  @Column({ name: 'AMaximoF', type: 'double' })
  amaximof: number;

  @Column({ name: 'ANormalF', type: 'double' })
  anormalf: number;

  @Column({ name: 'AMinimaF', type: 'double' })
  aminimaf: number;

  @Column({ name: 'PMAXIMOM', type: 'double' })
  pmaximom: number;

  @Column({ name: 'PNORMALM', type: 'double' })
  pnormalm: number;

  @Column({ name: 'PMINIMAM', type: 'double' })
  pminimam: number;

  @Column({ name: 'PMAXIMOF', type: 'double' })
  pmaximof: number;

  @Column({ name: 'PNORMALF', type: 'double' })
  pnormalf: number;

  @Column({ name: 'PMINIMAF', type: 'double' })
  pminimaf: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
