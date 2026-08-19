import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('historia_procedimientos')
export class HistoriaProcedimientos {
  @PrimaryColumn({ name: 'ID_PROCEDIMIENTO', type: 'int' })
  idProcedimiento: number;

  @PrimaryColumn({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @PrimaryColumn({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'DESCRIPCION', type: 'text' })
  descripcion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
