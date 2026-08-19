import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { Ordenes } from '../../admisiones/entities/ordenes.entity';
import { Diagnosticos } from '../../catalogos/entities/diagnosticos.entity';
import { Empleados } from '../../seguridad/entities/empleados.entity';

@Entity('patologia')
export class Patologia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  // Relación 1 a 1 en la práctica: cada orden tiene a lo sumo un informe de
  // patología (ver DPatologia.Existe() en el VB.NET original).
  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @ManyToOne(() => Ordenes)
  @JoinColumn({ name: 'ID_ORDEN' })
  orden?: Ordenes;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'FECHA_SALIDA', type: 'date' })
  fechaSalida: string;

  @Column({ name: 'TIPO_MUESTRA', type: 'char', length: 100 })
  tipoMuestra: string;

  @Column({ name: 'SITIO_LESION', type: 'char', length: 50 })
  sitioLesion: string;

  @Column({ name: 'SOLICITADO', type: 'char', length: 50 })
  solicitado: string;

  @Column({ name: 'DESCRIPCION_MACROSCOPICA', type: 'text' })
  descripcionMacroscopica: string;

  @Column({ name: 'DESCRIPCION_MICROSCOPICA', type: 'text' })
  descripcionMicroscopica: string;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'OBSERVACIONES', type: 'text' })
  observaciones: string;

  @Column({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 12 })
  codigoDiagnostico: string;

  @ManyToOne(() => Diagnosticos)
  @JoinColumn({ name: 'CODIGO_DIAGNOSTICO', referencedColumnName: 'codigoDiagnostico' })
  diagnosticoCie10?: Diagnosticos;

  // Patólogo que firma el informe (viene de la sesión, no se elige a mano).
  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @ManyToOne(() => Empleados)
  @JoinColumn({ name: 'ID_EMPLEADO' })
  patologo?: Empleados;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  // NOTA: en el VB.NET original este campo se llenaba (aparentemente por error/
  // resto de una versión previa) con el texto del combo de diagnóstico. Por
  // decisión del usuario, el identificador real del informe es
  // orden.CONSECUTIVO; este campo queda como texto libre opcional.
  @Column({ name: 'CODIGO_PATOLOGIA', type: 'char', length: 20, nullable: true })
  codigoPatologia?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
