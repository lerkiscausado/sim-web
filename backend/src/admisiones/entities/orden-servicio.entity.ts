import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('orden_servicio')
export class OrdenServicio {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ORDEN_SERVICO', type: 'char', length: 50 })
  ordenServico: string;

  @Column({ name: 'FECHA_ORDEN', type: 'date' })
  fechaOrden: string;

  @Column({ name: 'FECHA_VENCIMIENTO', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'CONCEPTO', type: 'text' })
  concepto: string;

  @Column({ name: 'VALOR', type: 'int' })
  valor: number;

  @Column({ name: 'DESCUENTO', type: 'int' })
  descuento: number;

  @Column({ name: 'Estado', type: 'set', enum: ['A', 'F', 'P'] })
  estado: string;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @Column({ name: 'TIPO_ORDEN', type: 'set', enum: ['SERVICIOS', 'PRODUCTOS'] })
  tipoOrden: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
