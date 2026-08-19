import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('tipo_documento')
export class TipoDocumento {
  @PrimaryColumn({ name: 'ID', type: 'char', length: 2 })
  id: string;

  @Column({ name: 'DESCRIPCION', type: 'char', length: 50 })
  descripcion: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
