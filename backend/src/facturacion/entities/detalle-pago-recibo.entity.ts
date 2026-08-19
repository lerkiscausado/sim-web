import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_pago_recibo')
export class DetallePagoRecibo {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_RECIBO', type: 'char', length: 50 })
  idRecibo: string;

  @Column({ name: 'ID_MEDIO_PAGO', type: 'int' })
  idMedioPago: number;

  @Column({ name: 'VALOR', type: 'double', precision: 10, scale: 3 })
  valor: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
