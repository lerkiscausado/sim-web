import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('resoluciones_dian')
export class ResolucionesDian {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'NUMERO_RESOLUCION', type: 'char', length: 50 })
  numeroResolucion: string;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'PREFIJO', type: 'char', length: 10, nullable: true })
  prefijo?: string | null;

  @Column({ name: 'NUMERO_INICIAL', type: 'char', length: 50 })
  numeroInicial: string;

  @Column({ name: 'NUMERO_FINAL', type: 'char', length: 50 })
  numeroFinal: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
