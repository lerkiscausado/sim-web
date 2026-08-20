import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('informes')
export class Informes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'char', length: 150 })
  nombre: string;

  @Column({ name: 'QUERY', type: 'text' })
  query: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
