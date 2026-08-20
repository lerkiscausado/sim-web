import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('plantillas_patologia')
export class PlantillasPatologia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'char', length: 100 })
  nombre: string;

  @Column({ name: 'MACRO', type: 'text' })
  macro: string;

  @Column({ name: 'MICRO', type: 'text' })
  micro: string;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
