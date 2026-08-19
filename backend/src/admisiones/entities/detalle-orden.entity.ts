import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CausaExterna } from '../../catalogos/entities/causa-externa.entity';
import { FinalidadConsulta } from '../../catalogos/entities/finalidad-consulta.entity';
import { FinalidadProcedimiento } from '../../catalogos/entities/finalidad-procedimiento.entity';
import { AmbitoProcedimiento } from '../../catalogos/entities/ambito-procedimiento.entity';
import { PersonaAtiende } from './persona-atiende.entity';
import { TipoDiagnostico } from '../../catalogos/entities/tipo-diagnostico.entity';
import { FormaRealizacion } from '../../catalogos/entities/forma-realizacion.entity';
import { Cups } from '../../catalogos/entities/cups.entity';
import { TipoEstudio } from '../../catalogos/entities/tipo-estudio.entity';

export enum TipoDetalleOrden {
  C = 'C',
  P = 'P',
  U = 'U',
  H = 'H',
  M = 'M',
  A = 'A',
  O = 'O',
}

export enum EstadoDetalleOrden {
  PENDIENTE = 'PENDIENTE',
  PROCESO = 'PROCESO',
  ATENDIDO = 'ATENDIDO',
  CANCELADO = 'CANCELADO',
}

@Entity('detalle_orden')
export class DetalleOrden {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  // NOTA: en la BD real ID_ORDEN es char(50) mientras que ordenes.ID es int
  // (inconsistencia heredada del sistema legado, no se corrige el tipo de
  // columna). TypeORM no soporta una relación @ManyToOne cuando el tipo de
  // columna no coincide con el de la PK referenciada (falla en runtime:
  // "Column does not support length property"), así que este campo queda
  // como columna simple. Para unir con `ordenes` desde código, usar
  // QueryBuilder con CAST explícito, ej:
  //   .innerJoin('ordenes', 'o', 'o.ID = CAST(detalle_orden.ID_ORDEN AS UNSIGNED)')
  @Column({ name: 'ID_ORDEN', type: 'char', length: 50 })
  idOrden: string;

  @Column({ name: 'ID_CAUSA', type: 'int' })
  idCausa: number;

  @ManyToOne(() => CausaExterna)
  @JoinColumn({ name: 'ID_CAUSA' })
  causa?: CausaExterna;

  @Column({ name: 'ID_FINALIDAD_CONSULTA', type: 'int' })
  idFinalidadConsulta: number;

  @ManyToOne(() => FinalidadConsulta)
  @JoinColumn({ name: 'ID_FINALIDAD_CONSULTA' })
  finalidadConsulta?: FinalidadConsulta;

  @Column({ name: 'ID_FINALIDAD_PROCEDIMIENTO', type: 'int' })
  idFinalidadProcedimiento: number;

  @ManyToOne(() => FinalidadProcedimiento)
  @JoinColumn({ name: 'ID_FINALIDAD_PROCEDIMIENTO' })
  finalidadProcedimiento?: FinalidadProcedimiento;

  @Column({ name: 'ID_AMBITO', type: 'int' })
  idAmbito: number;

  @ManyToOne(() => AmbitoProcedimiento)
  @JoinColumn({ name: 'ID_AMBITO' })
  ambito?: AmbitoProcedimiento;

  @Column({ name: 'ID_PERSONA_ATIENDE', type: 'int' })
  idPersonaAtiende: number;

  @ManyToOne(() => PersonaAtiende)
  @JoinColumn({ name: 'ID_PERSONA_ATIENDE' })
  personaAtiende?: PersonaAtiende;

  @Column({ name: 'FECHA_SALIDA', type: 'date', nullable: true })
  fechaSalida?: string | null;

  @Column({ name: 'HORA', type: 'time', nullable: true })
  hora?: string | null;

  @Column({ name: 'ID_TIPO_DIAGNOSTICO', type: 'int' })
  idTipoDiagnostico: number;

  @ManyToOne(() => TipoDiagnostico)
  @JoinColumn({ name: 'ID_TIPO_DIAGNOSTICO' })
  tipoDiagnostico?: TipoDiagnostico;

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

  @ManyToOne(() => FormaRealizacion)
  @JoinColumn({ name: 'ID_FORMA_REALIZACION' })
  formaRealizacion?: FormaRealizacion;

  @Column({ name: 'CODIGO_PROCEDIMIENTO', type: 'char', length: 50 })
  codigoProcedimiento: string;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 12 })
  codigoCups: string;

  @ManyToOne(() => Cups)
  @JoinColumn({ name: 'CODIGO_CUPS', referencedColumnName: 'codigoCups' })
  cups?: Cups;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @ManyToOne(() => TipoEstudio)
  @JoinColumn({ name: 'ID_TIPO_ESTUDIO' })
  tipoEstudio?: TipoEstudio;

  @Column({ name: 'VALOR', type: 'bigint' })
  valor: number;

  @Column({ name: 'COPAGO', type: 'bigint', nullable: true })
  copago?: number | null;

  @Column({ name: 'NETO', type: 'bigint', nullable: true })
  neto?: number | null;

  @Column({ name: 'TIPO', type: 'set', enum: TipoDetalleOrden })
  tipo: TipoDetalleOrden;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoDetalleOrden })
  estado: EstadoDetalleOrden;

  @Column({ name: 'ID_RELACION', type: 'char', length: 50 })
  idRelacion: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
