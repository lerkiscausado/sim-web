import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('tipo_estudio')
export class TipoEstudio {
  @PrimaryColumn({ name: 'ID', type: 'bigint' })
  id: number;

  @Column({ name: 'NOMBRE_TIPO_ESTUDIO', type: 'char', length: 100 })
  nombreTipoEstudio: string;

  @Column({ name: 'PREFIJO', type: 'char', length: 2 })
  prefijo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
