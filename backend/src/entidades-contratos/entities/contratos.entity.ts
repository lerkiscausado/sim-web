import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('contratos')
export class Contratos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'CODIGO_ENTIDAD', type: 'char', length: 50 })
  codigoEntidad: string;

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

  @Column({ name: 'TIPO_CONTRATO', type: 'set', enum: ['EVENTO', 'CAPITADO', 'PAQUETE'] })
  tipoContrato: string;

  @Column({ name: 'RIPS', type: 'set', enum: ['SI', 'NO'] })
  rips: string;

  @Column({ name: 'ID_TARIFA', type: 'int', nullable: true })
  idTarifa?: number | null;

  @Column({ name: 'VALOR_CONVENIO', type: 'bigint', nullable: true })
  valorConvenio?: number | null;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'usuario', type: 'char', length: 50 })
  usuario: string;

  @Column({ name: 'contrasena', type: 'char', length: 50 })
  contrasena: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
