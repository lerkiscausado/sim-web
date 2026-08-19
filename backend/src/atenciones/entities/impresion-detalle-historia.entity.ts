import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('impresion_detalle_historia')
export class ImpresionDetalleHistoria {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'NOMBRE_RXS', type: 'char', length: 50, nullable: true })
  nombreRxs?: string | null;

  @Column({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 10, nullable: true })
  codigoDiagnostico?: string | null;

  @Column({ name: 'DIAGNOSTICO', type: 'char', length: 200, nullable: true })
  diagnostico?: string | null;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 10, nullable: true })
  codigoCups?: string | null;

  @Column({ name: 'NOMBRE_CUPS', type: 'char', length: 200, nullable: true })
  nombreCups?: string | null;

  @Column({ name: 'NOMBRE_MEDICAMENTO', type: 'char', length: 100, nullable: true })
  nombreMedicamento?: string | null;

  @Column({ name: 'VIA_ADMINISTRACION', type: 'char', length: 50, nullable: true })
  viaAdministracion?: string | null;

  @Column({ name: 'DOSIS', type: 'char', length: 50, nullable: true })
  dosis?: string | null;

  @Column({ name: 'CANTIDAD', type: 'char', length: 10, nullable: true })
  cantidad?: string | null;

  @Column({ name: 'DESCRIPCION', type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ name: 'TABLA', type: 'set', enum: ['R', 'D', 'L', 'M', 'O'] })
  tabla: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
