import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('endoscopias')
export class Endoscopias {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'FECHA_ESTUDIO', type: 'date' })
  fechaEstudio: string;

  @Column({ name: 'FECHA_SALIDA', type: 'date' })
  fechaSalida: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'MEDICO_SOLICITA', type: 'char', length: 50 })
  medicoSolicita: string;

  @Column({ name: 'INDICACION', type: 'char', length: 100 })
  indicacion: string;

  @Column({ name: 'MEDICAMENTOS', type: 'char', length: 200, nullable: true })
  medicamentos?: string | null;

  @Column({ name: 'ID_EQUIPO', type: 'int' })
  idEquipo: number;

  @Column({ name: 'ID_PROCEDIMIENTO_TERAPEUTICO', type: 'int' })
  idProcedimientoTerapeutico: number;

  @Column({ name: 'ANESTESIOLOGO', type: 'char', length: 50, nullable: true })
  anestesiologo?: string | null;

  @Column({ name: 'CAMPO1', type: 'text' })
  campo1: string;

  @Column({ name: 'CAMPO2', type: 'text' })
  campo2: string;

  @Column({ name: 'CAMPO3', type: 'text' })
  campo3: string;

  @Column({ name: 'CAMPO4', type: 'text', nullable: true })
  campo4?: string | null;

  @Column({ name: 'CAMPO5', type: 'text', nullable: true })
  campo5?: string | null;

  @Column({ name: 'CAMPO6', type: 'text', nullable: true })
  campo6?: string | null;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 4, nullable: true })
  codigoDiagnostico?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
