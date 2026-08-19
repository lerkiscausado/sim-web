import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('detalle_orden')
export class DetalleOrden {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'char', length: 50 })
  idOrden: string;

  @Column({ name: 'ID_CAUSA', type: 'int' })
  idCausa: number;

  @Column({ name: 'ID_FINALIDAD_CONSULTA', type: 'int' })
  idFinalidadConsulta: number;

  @Column({ name: 'ID_FINALIDAD_PROCEDIMIENTO', type: 'int' })
  idFinalidadProcedimiento: number;

  @Column({ name: 'ID_AMBITO', type: 'int' })
  idAmbito: number;

  @Column({ name: 'ID_PERSONA_ATIENDE', type: 'int' })
  idPersonaAtiende: number;

  @Column({ name: 'FECHA_SALIDA', type: 'date', nullable: true })
  fechaSalida?: string | null;

  @Column({ name: 'HORA', type: 'time', nullable: true })
  hora?: string | null;

  @Column({ name: 'ID_TIPO_DIAGNOSTICO', type: 'int' })
  idTipoDiagnostico: number;

  @Column({ name: 'DIAGNOSTICO1', type: 'char', length: 10, nullable: true })
  diagnostico1?: string | null;

  @Column({ name: 'DIAGNOSTICO2', type: 'char', length: 10, nullable: true })
  diagnostico2?: string | null;

  @Column({ name: 'DIAGNOSTICO3', type: 'char', length: 10, nullable: true })
  diagnostico3?: string | null;

  @Column({ name: 'DIAGNOSTICO4', type: 'char', length: 10, nullable: true })
  diagnostico4?: string | null;

  @Column({ name: 'ID_FORMA_REALIZACION', type: 'int' })
  idFormaRealizacion: number;

  @Column({ name: 'CODIGO_PROCEDIMIENTO', type: 'char', length: 50 })
  codigoProcedimiento: string;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 12 })
  codigoCups: string;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @Column({ name: 'VALOR', type: 'bigint' })
  valor: number;

  @Column({ name: 'COPAGO', type: 'bigint', nullable: true })
  copago?: number | null;

  @Column({ name: 'NETO', type: 'bigint', nullable: true })
  neto?: number | null;

  @Column({ name: 'TIPO', type: 'set', enum: ['C', 'P', 'U', 'H', 'M', 'A', 'O'] })
  tipo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: ['PENDIENTE', 'PROCESO', 'ATENDIDO', 'CANCELADO'] })
  estado: string;

  @Column({ name: 'ID_RELACION', type: 'char', length: 50 })
  idRelacion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
