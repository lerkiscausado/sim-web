import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('cups')
export class Cups {
  @PrimaryColumn({ name: 'CODIGO_CUPS', type: 'char', length: 12 })
  codigoCups: string;

  @Column({ name: 'NOMBRE_CUPS', type: 'varchar', length: 300 })
  nombreCups: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
