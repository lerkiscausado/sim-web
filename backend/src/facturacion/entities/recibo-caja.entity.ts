import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('recibo_caja')
export class ReciboCaja {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'CIUDAD', type: 'char', length: 50 })
  ciudad: string;

  @Column({ name: 'NOMBRE', type: 'char', length: 50 })
  nombre: string;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 20 })
  identificacion: string;

  @Column({ name: 'DIRECCION', type: 'char', length: 50, nullable: true })
  direccion?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'VALOR', type: 'double' })
  valor: number;

  @Column({ name: 'CONCEPTO', type: 'text' })
  concepto: string;

  @Column({ name: 'ESTADO', type: 'set', enum: ['R', 'A', 'C'] })
  estado: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'ID_CIERRE', type: 'int', nullable: true })
  idCierre?: number | null;

  @Column({ name: 'REFERENCIA', type: 'char', length: 50, nullable: true })
  referencia?: string | null;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
