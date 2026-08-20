import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('cotizaciones')
export class Cotizaciones {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'COTIZACION', type: 'char', length: 50 })
  cotizacion: string;

  @Column({ name: 'FECHA_COTIZACION', type: 'date' })
  fechaCotizacion: string;

  @Column({ name: 'FECHA_VENCIMIENTO', type: 'date' })
  fechaVencimiento: string;

  @Column({ name: 'CONCEPTO', type: 'text' })
  concepto: string;

  @Column({ name: 'VALOR', type: 'int' })
  valor: number;

  @Column({ name: 'DESCUENTO', type: 'int' })
  descuento: number;

  @Column({ name: 'Estado', type: 'enum', enum: ['A', 'F'] })
  estado: string;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @Column({ name: 'TIPO_FACTURA', type: 'enum', enum: ['SERVICIOS', 'PRODUCTOS'] })
  tipoFactura: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
