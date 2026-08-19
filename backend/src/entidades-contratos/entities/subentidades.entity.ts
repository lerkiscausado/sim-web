import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivoEliminado } from '../../common/enums/estado.enum';

@Entity('subentidades')
export class Subentidades {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'id_contrato', type: 'int' })
  idContrato: number;

  @Column({ name: 'nombre', type: 'char', length: 60 })
  nombre: string;

  @Column({ name: 'estado', type: 'set', enum: EstadoActivoInactivoEliminado })
  estado: EstadoActivoInactivoEliminado;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
