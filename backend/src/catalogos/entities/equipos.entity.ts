import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('equipos')
export class Equipos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE', type: 'char', length: 50 })
  nombre: string;

  @Column({ name: 'MARCA', type: 'char', length: 50 })
  marca: string;

  @Column({ name: 'MODELO', type: 'char', length: 50 })
  modelo: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
