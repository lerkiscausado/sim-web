import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('historia_medicamentos')
export class HistoriaMedicamentos {
  @PrimaryColumn({ name: 'ID_MEDICAMENTO', type: 'int' })
  idMedicamento: number;

  @PrimaryColumn({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @PrimaryColumn({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'ID_VIA_ADMINISTRACION', type: 'int' })
  idViaAdministracion: number;

  @Column({ name: 'DOSIS', type: 'char', length: 50 })
  dosis: string;

  @Column({ name: 'CANTIDAD', type: 'char', length: 5 })
  cantidad: string;

  @Column({ name: 'DESCRIPCION', type: 'text' })
  descripcion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
