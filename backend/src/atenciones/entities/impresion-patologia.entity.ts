import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('impresion_patologia')
export class ImpresionPatologia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'idOrden', type: 'int' })
  idorden: number;

  @Column({ name: 'CONSECUTIVO', type: 'char', length: 100, nullable: true })
  consecutivo?: string | null;

  @Column({ name: 'FECHA_INGRESO', type: 'date', nullable: true })
  fechaIngreso?: string | null;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 100, nullable: true })
  identificacion?: string | null;

  @Column({ name: 'NOMBRE', type: 'char', length: 200, nullable: true })
  nombre?: string | null;

  @Column({ name: 'EDAD', type: 'char', length: 200, nullable: true })
  edad?: string | null;

  @Column({ name: 'SEXO', type: 'enum', enum: ['M', 'F'], nullable: true })
  sexo?: string | null;

  @Column({ name: 'ESTADO_CIVIL', type: 'char', length: 100, nullable: true })
  estadoCivil?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 100, nullable: true })
  telefono?: string | null;

  @Column({ name: 'DIRECCION', type: 'char', length: 200, nullable: true })
  direccion?: string | null;

  @Column({ name: 'NOMBRE_ENTIDAD', type: 'char', length: 200, nullable: true })
  nombreEntidad?: string | null;

  @Column({ name: 'TIPO_MUESTRA', type: 'char', length: 200, nullable: true })
  tipoMuestra?: string | null;

  @Column({ name: 'SITIO_LESION', type: 'char', length: 200, nullable: true })
  sitioLesion?: string | null;

  @Column({ name: 'SOLICITADO', type: 'char', length: 200, nullable: true })
  solicitado?: string | null;

  @Column({ name: 'DESCRIPCION_MACROSCOPICA', type: 'text', nullable: true })
  descripcionMacroscopica?: string | null;

  @Column({ name: 'DESCRIPCION_MICROSCOPICA', type: 'text', nullable: true })
  descripcionMicroscopica?: string | null;

  @Column({ name: 'DIAGNOSTICO', type: 'text', nullable: true })
  diagnostico?: string | null;

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 100, nullable: true })
  codigoDiagnostico?: string | null;

  @Column({ name: 'nombre_diagnostico', type: 'char', length: 200, nullable: true })
  nombreDiagnostico?: string | null;

  @Column({ name: 'ID_LICENCIA', type: 'int', nullable: true })
  idLicencia?: number | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int', nullable: true })
  idEmpleado?: number | null;

  @Column({ name: 'medico', type: 'char', length: 100, nullable: true })
  medico?: string | null;

  @Column({ name: 'especialidad', type: 'char', length: 200, nullable: true })
  especialidad?: string | null;

  @Column({ name: 'registro_medico', type: 'char', length: 100, nullable: true })
  registroMedico?: string | null;

  @Column({ name: 'firma', type: 'blob', nullable: true })
  firma?: Buffer | null;

  @Column({ name: 'fecha_salida', type: 'date', nullable: true })
  fechaSalida?: string | null;

  @Column({ name: 'sede', type: 'char', length: 200, nullable: true })
  sede?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
