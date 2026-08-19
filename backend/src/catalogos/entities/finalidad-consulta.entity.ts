import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('finalidad_consulta')
export class FinalidadConsulta {
  @PrimaryColumn({ name: 'ID', type: 'char', length: 2 })
  id: string;

  @Column({ name: 'NOMBRE_FINALIDAD', type: 'varchar', length: 150 })
  nombreFinalidad: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
