import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('tipo_afiliado')
export class TipoAfiliado {
  @PrimaryColumn({ name: 'ID', type: 'bigint' })
  id: number;

  @Column({ name: 'NOMBRE_TIPO_AFILIADO', type: 'varchar', length: 100 })
  nombreTipoAfiliado: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
