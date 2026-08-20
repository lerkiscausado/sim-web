import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuarios } from '../../pacientes/entities/usuarios.entity';
import { Contratos } from '../../entidades-contratos/entities/contratos.entity';
import { Subentidades } from '../../entidades-contratos/entities/subentidades.entity';
import { Ingreso } from './ingreso.entity';
import { Sedes } from './sedes.entity';
import { Empleados } from '../../seguridad/entities/empleados.entity';
import { TipoAfiliado } from '../../catalogos/entities/tipo-afiliado.entity';
import { TipoUsuario } from '../../catalogos/entities/tipo-usuario.entity';
import { TipoEstudio } from '../../catalogos/entities/tipo-estudio.entity';
import { Especimenes } from '../../atenciones/entities/especimenes.entity';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

export enum EstadoOrden {
  PENDIENTE = 'PENDIENTE',
  PROCESO = 'PROCESO',
  ATENDIDO = 'ATENDIDO',
  CANCELADO = 'CANCELADO',
  FACTURADO = 'FACTURADO',
}

@Entity('ordenes')
export class Ordenes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @ManyToOne(() => Usuarios)
  @JoinColumn({ name: 'ID_USUARIO' })
  paciente?: Usuarios;

  @Column({ name: 'ID_CONTRATO', type: 'int' })
  idContrato: number;

  @ManyToOne(() => Contratos)
  @JoinColumn({ name: 'ID_CONTRATO' })
  contrato?: Contratos;

  @Column({ name: 'ID_SUBENTIDAD', type: 'int' })
  idSubentidad: number;

  @ManyToOne(() => Subentidades)
  @JoinColumn({ name: 'ID_SUBENTIDAD' })
  subentidad?: Subentidades;

  @Column({ name: 'ID_INGRESO', type: 'int' })
  idIngreso: number;

  @ManyToOne(() => Ingreso)
  @JoinColumn({ name: 'ID_INGRESO' })
  ingreso?: Ingreso;

  @Column({ name: 'ID_SEDE', type: 'int' })
  idSede: number;

  @ManyToOne(() => Sedes)
  @JoinColumn({ name: 'ID_SEDE' })
  sede?: Sedes;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @ManyToOne(() => Empleados)
  @JoinColumn({ name: 'ID_EMPLEADO' })
  empleado?: Empleados;

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

  @ManyToOne(() => TipoAfiliado)
  @JoinColumn({ name: 'ID_TIPO_AFILIADO' })
  tipoAfiliado?: TipoAfiliado;

  @Column({ name: 'ID_TIPO_USUARIO', type: 'int' })
  idTipoUsuario: number;

  @ManyToOne(() => TipoUsuario)
  @JoinColumn({ name: 'ID_TIPO_USUARIO' })
  tipoUsuario?: TipoUsuario;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @ManyToOne(() => TipoEstudio)
  @JoinColumn({ name: 'ID_TIPO_ESTUDIO' })
  tipoEstudio?: TipoEstudio;

  @Column({ name: 'COMENTARIOS', type: 'text', nullable: true })
  comentarios?: string | null;

  @Column({ name: 'CONSECUTIVO', type: 'char', length: 20 })
  consecutivo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoOrden, transformer: setColumnTransformer })
  estado: EstadoOrden;

  @Column({ name: 'ID_ESPECIMEN', type: 'int' })
  idEspecimen: number;

  @ManyToOne(() => Especimenes)
  @JoinColumn({ name: 'ID_ESPECIMEN' })
  especimen?: Especimenes;

  @Column({ name: 'SALDO', type: 'double', nullable: true })
  saldo?: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
