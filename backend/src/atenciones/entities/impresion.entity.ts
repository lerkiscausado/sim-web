import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('impresion')
export class Impresion {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'FECHA', type: 'date', nullable: true })
  fecha?: string | null;

  @Column({ name: 'ID_ORDEN', type: 'int', nullable: true })
  idOrden?: number | null;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int', nullable: true })
  idDetalleOrden?: number | null;

  @Column({ name: 'CONSECUTIVO', type: 'char', length: 50, nullable: true })
  consecutivo?: string | null;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 50, nullable: true })
  identificacion?: string | null;

  @Column({ name: 'NOMBRE', type: 'char', length: 100, nullable: true })
  nombre?: string | null;

  @Column({ name: 'EDAD', type: 'char', length: 50, nullable: true })
  edad?: string | null;

  @Column({ name: 'SEXO', type: 'char', length: 50, nullable: true })
  sexo?: string | null;

  @Column({ name: 'ESTADO_CIVIL', type: 'char', length: 50, nullable: true })
  estadoCivil?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'DIRECCION', type: 'char', length: 100, nullable: true })
  direccion?: string | null;

  @Column({ name: 'CORREO', type: 'char', length: 150, nullable: true })
  correo?: string | null;

  @Column({ name: 'CONTRATO', type: 'char', length: 100, nullable: true })
  contrato?: string | null;

  @Column({ name: 'ENTIDAD', type: 'char', length: 100, nullable: true })
  entidad?: string | null;

  @Column({ name: 'SUB_ENTIDAD', type: 'char', length: 100, nullable: true })
  subEntidad?: string | null;

  @Column({ name: 'TIPO_ESTUDIO', type: 'char', length: 100, nullable: true })
  tipoEstudio?: string | null;

  @Column({ name: 'MEDICO', type: 'char', length: 100, nullable: true })
  medico?: string | null;

  @Column({ name: 'ESPECIALIDAD', type: 'char', length: 100, nullable: true })
  especialidad?: string | null;

  @Column({ name: 'REGISTRO_MEDICO', type: 'char', length: 50, nullable: true })
  registroMedico?: string | null;

  @Column({ name: 'FIRMA', type: 'blob', nullable: true })
  firma?: Buffer | null;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
