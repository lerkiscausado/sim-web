import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('tipo_identificacion')
export class TipoIdentificacion {
  @PrimaryColumn({ name: 'ID', type: 'char', length: 2 })
  id: string;

  @Column({ name: 'NOMBRE_TIPO_IDENTIFICACION', type: 'varchar', length: 30 })
  nombreTipoIdentificacion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
