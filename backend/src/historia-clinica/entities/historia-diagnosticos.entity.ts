import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('historia_diagnosticos')
export class HistoriaDiagnosticos {
  @PrimaryColumn({ name: 'ID_DIAGNOSTICO', type: 'char', length: 4 })
  idDiagnostico: string;

  @PrimaryColumn({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @PrimaryColumn({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'DESCRIPCION', type: 'text', nullable: true })
  descripcion?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
