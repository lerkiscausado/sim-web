import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('ordenes')
export class Ordenes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @Column({ name: 'ID_CONTRATO', type: 'int' })
  idContrato: number;

  @Column({ name: 'ID_SUBENTIDAD', type: 'int' })
  idSubentidad: number;

  @Column({ name: 'ID_INGRESO', type: 'int' })
  idIngreso: number;

  @Column({ name: 'ID_SEDE', type: 'int' })
  idSede: number;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'AUTORIZACION', type: 'char', length: 50, nullable: true })
  autorizacion?: string | null;

  @Column({ name: 'NUMERO_ORDEN', type: 'char', length: 50 })
  numeroOrden: string;

  @Column({ name: 'FECHA_INGRESO', type: 'date' })
  fechaIngreso: string;

  @Column({ name: 'FECHA_ORDEN', type: 'date', nullable: true })
  fechaOrden?: string | null;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'ID_FACTURA', type: 'char', length: 11 })
  idFactura: string;

  @Column({ name: 'ID_TIPO_AFILIADO', type: 'int' })
  idTipoAfiliado: number;

  @Column({ name: 'ID_TIPO_USUARIO', type: 'int' })
  idTipoUsuario: number;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @Column({ name: 'COMENTARIOS', type: 'text', nullable: true })
  comentarios?: string | null;

  @Column({ name: 'CONSECUTIVO', type: 'char', length: 20 })
  consecutivo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: ['PENDIENTE', 'PROCESO', 'ATENDIDO', 'CANCELADO', 'FACTURADO'] })
  estado: string;

  @Column({ name: 'ID_ESPECIMEN', type: 'int' })
  idEspecimen: number;

  @Column({ name: 'SALDO', type: 'double', nullable: true })
  saldo?: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
