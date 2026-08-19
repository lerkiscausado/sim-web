import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { Cargos } from '../../catalogos/entities/cargos.entity';
import { Especialidades } from '../../catalogos/entities/especialidades.entity';

@Entity('empleados')
export class Empleados {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE_EMPLEADO', type: 'char', length: 50 })
  nombreEmpleado: string;

  @Column({ name: 'ID_CARGO', type: 'int' })
  idCargo: number;

  @ManyToOne(() => Cargos)
  @JoinColumn({ name: 'ID_CARGO' })
  cargo?: Cargos;

  @Column({ name: 'ID_ESPECIALIDAD', type: 'int' })
  idEspecialidad: number;

  @ManyToOne(() => Especialidades)
  @JoinColumn({ name: 'ID_ESPECIALIDAD' })
  especialidad?: Especialidades;

  @Column({ name: 'REGISTRO_MEDICO', type: 'varchar', length: 10, nullable: true })
  registroMedico?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'FIRMA', type: 'blob', nullable: true })
  firma?: Buffer | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
