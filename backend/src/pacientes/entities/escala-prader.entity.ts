import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('escala_prader')
export class EscalaPrader {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'char', length: 50, nullable: true })
  nombre?: string | null;

  @Column({ name: 'IMAGEN', type: 'blob', nullable: true })
  imagen?: Buffer | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
