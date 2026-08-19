import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('causa_externa')
export class CausaExterna {
  @PrimaryColumn({ name: 'ID', type: 'char', length: 2 })
  id: string;

  @Column({ name: 'NOMBRE_CAUSA_EXTERNA', type: 'varchar', length: 100 })
  nombreCausaExterna: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
