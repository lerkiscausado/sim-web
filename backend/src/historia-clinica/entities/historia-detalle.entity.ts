import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('historia_detalle')
export class HistoriaDetalle {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'FUNCION_ESCROTAL', type: 'char', length: 10, nullable: true })
  funcionEscrotal?: string | null;

  @Column({ name: 'MICRO_PENE', type: 'char', length: 10, nullable: true })
  microPene?: string | null;

  @Column({ name: 'MEATUS_URETRAL', type: 'char', length: 10, nullable: true })
  meatusUretral?: string | null;

  @Column({ name: 'TESTICULO_IZQUIERDO', type: 'char', length: 10, nullable: true })
  testiculoIzquierdo?: string | null;

  @Column({ name: 'TESTICULO_DERECHO', type: 'char', length: 10, nullable: true })
  testiculoDerecho?: string | null;

  @Column({ name: 'ID_ESCALA_PRADER', type: 'int' })
  idEscalaPrader: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
