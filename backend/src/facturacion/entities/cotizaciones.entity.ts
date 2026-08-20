import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

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

  @Column({ name: 'Estado', type: 'set', enum: ['A', 'F'], transformer: setColumnTransformer })
  estado: string;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @Column({ name: 'TIPO_FACTURA', type: 'set', enum: ['SERVICIOS', 'PRODUCTOS'], transformer: setColumnTransformer })
  tipoFactura: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
