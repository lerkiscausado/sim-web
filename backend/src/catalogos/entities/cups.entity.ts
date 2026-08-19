import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('cups')
export class Cups {
  @PrimaryColumn({ name: 'CODIGO_CUPS', type: 'char', length: 12 })
  codigoCups: string;

  @Column({ name: 'NOMBRE_CUPS', type: 'varchar', length: 300 })
  nombreCups: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
