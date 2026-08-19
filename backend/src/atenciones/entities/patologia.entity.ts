import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('patologia')
export class Patologia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

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

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'CODIGO_PATOLOGIA', type: 'char', length: 20, nullable: true })
  codigoPatologia?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
