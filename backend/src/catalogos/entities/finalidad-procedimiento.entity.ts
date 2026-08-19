import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('finalidad_procedimiento')
export class FinalidadProcedimiento {
  @PrimaryColumn({ name: 'ID', type: 'int' })
  id: number;

  @Column({ name: 'NOMBRE_FINALIDAD_PROCEDIMIENTO', type: 'varchar', length: 100 })
  nombreFinalidadProcedimiento: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
