import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('entidades')
export class Entidades {
  @PrimaryColumn({ name: 'CODIGO_ENTIDAD', type: 'char', length: 50 })
  codigoEntidad: string;

  @Column({ name: 'NOMBRE_ENTIDAD', type: 'char', length: 100 })
  nombreEntidad: string;

  @Column({ name: 'NIT', type: 'char', length: 50, nullable: true })
  nit?: string | null;

  @Column({ name: 'DIRECCION', type: 'varchar', length: 250, nullable: true })
  direccion?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
