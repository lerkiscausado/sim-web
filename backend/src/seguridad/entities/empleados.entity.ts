import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('empleados')
export class Empleados {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NOMBRE_EMPLEADO', type: 'char', length: 50 })
  nombreEmpleado: string;

  @Column({ name: 'ID_CARGO', type: 'int' })
  idCargo: number;

  @Column({ name: 'ID_ESPECIALIDAD', type: 'int' })
  idEspecialidad: number;

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
