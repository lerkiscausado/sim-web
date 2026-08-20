import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('facturas')
export class Facturas {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'FACTURA', type: 'char', length: 50 })
  factura: string;

  @Column({ name: 'ID_CONTRATO', type: 'int' })
  idContrato: number;

  @Column({ name: 'FECHA_FACTURA', type: 'date' })
  fechaFactura: string;

  @Column({ name: 'FECHA_VENCIMIENTO', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'CONCEPTO', type: 'text' })
  concepto: string;

  @Column({ name: 'VALOR', type: 'int' })
  valor: number;

  @Column({ name: 'COPAGOS', type: 'int' })
  copagos: number;

  @Column({ name: 'DESCUENTO', type: 'int' })
  descuento: number;

  @Column({ name: 'Estado', type: 'enum', enum: ['A', 'F'] })
  estado: string;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @Column({ name: 'TIPO_FACTURA', type: 'enum', enum: ['SERVICIOS', 'PRODUCTOS'] })
  tipoFactura: string;

  @Column({ name: 'REMISION', type: 'enum', enum: ['F', 'R'] })
  remision: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'RIPS', type: 'int' })
  rips: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
