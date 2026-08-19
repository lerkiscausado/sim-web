import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_pago_factura')
export class DetallePagoFactura {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_FACTURA', type: 'int' })
  idFactura: number;

  @Column({ name: 'ID_MEDIO_PAGO', type: 'int' })
  idMedioPago: number;

  @Column({ name: 'VALOR', type: 'double', precision: 10, scale: 3 })
  valor: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
