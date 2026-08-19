import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivoEliminado } from '../../common/enums/estado.enum';

@Entity('cargos')
export class Cargos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE_CARGO', type: 'char', length: 50 })
  nombreCargo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivoEliminado })
  estado: EstadoActivoInactivoEliminado;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
