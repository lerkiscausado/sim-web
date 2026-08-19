import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('documentospdf')
export class Documentospdf {
  @PrimaryGeneratedColumn({ name: 'Id' })
  id: number;

  @Column({ name: 'Consecutivo', type: 'varchar', length: 15 })
  consecutivo: string;

  @Column({ name: 'PDF', type: 'longblob', nullable: true })
  pdf?: Buffer | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
