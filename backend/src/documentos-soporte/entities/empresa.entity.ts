import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('empresa')
export class Empresa {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ID_TIPO_IDENTIFICACION', type: 'char', length: 2 })
  idTipoIdentificacion: string;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 50 })
  identificacion: string;

  @Column({ name: 'NOMBRE', type: 'char', length: 100 })
  nombre: string;

  @Column({ name: 'DIRECCION', type: 'char', length: 200, nullable: true })
  direccion?: string | null;

  @Column({ name: 'CIUDAD', type: 'char', length: 100, nullable: true })
  ciudad?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'CELULAR', type: 'char', length: 50, nullable: true })
  celular?: string | null;

  @Column({ name: 'FAX', type: 'char', length: 50, nullable: true })
  fax?: string | null;

  @Column({ name: 'EMAIL', type: 'char', length: 200, nullable: true })
  email?: string | null;

  @Column({ name: 'PAGINAWEB', type: 'char', length: 200, nullable: true })
  paginaweb?: string | null;

  @Column({ name: 'LOGO', type: 'blob', nullable: true })
  logo?: Buffer | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
