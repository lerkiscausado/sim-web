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
import { Entidades } from './entidades.entity';
import { Tarifas } from './tarifas.entity';
import { Licencias } from '../../seguridad/entities/licencias.entity';

export enum TipoContrato {
  EVENTO = 'EVENTO',
  CAPITADO = 'CAPITADO',
  PAQUETE = 'PAQUETE',
}

@Entity('contratos')
export class Contratos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'CODIGO_ENTIDAD', type: 'char', length: 50 })
  codigoEntidad: string;

  @ManyToOne(() => Entidades)
  @JoinColumn({ name: 'CODIGO_ENTIDAD', referencedColumnName: 'codigoEntidad' })
  entidad?: Entidades;

  @Column({ name: 'NOMBRE', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'NUMERO_CONTRATO', type: 'varchar', length: 50, nullable: true })
  numeroContrato?: string | null;

  @Column({ name: 'FECHA_INICIO', type: 'date', nullable: true })
  fechaInicio?: string | null;

  @Column({ name: 'FECHA_FINAL', type: 'date' })
  fechaFinal: string;

  @Column({ name: 'OBSERVACIONES', type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ name: 'CONTACTO', type: 'char', length: 50, nullable: true })
  contacto?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'CORREO_ELECTRONICO', type: 'varchar', length: 100, nullable: true })
  correoElectronico?: string | null;

  @Column({ name: 'TIPO_CONTRATO', type: 'enum', enum: TipoContrato })
  tipoContrato: TipoContrato;

  @Column({ name: 'RIPS', type: 'enum', enum: ['SI', 'NO'] })
  rips: string;

  @Column({ name: 'ID_TARIFA', type: 'int', nullable: true })
  idTarifa?: number | null;

  @ManyToOne(() => Tarifas, { nullable: true })
  @JoinColumn({ name: 'ID_TARIFA' })
  tarifa?: Tarifas | null;

  @Column({ name: 'VALOR_CONVENIO', type: 'bigint', nullable: true })
  valorConvenio?: number | null;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @ManyToOne(() => Licencias)
  @JoinColumn({ name: 'ID_LICENCIA' })
  licencia?: Licencias;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  // Credenciales del portal externo del contrato (dato legado propio del
  // sistema VB.NET, no relacionado con el login web nuevo).
  @Column({ name: 'usuario', type: 'char', length: 50 })
  usuario: string;

  @Column({ name: 'contrasena', type: 'char', length: 50, select: false })
  contrasena: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
