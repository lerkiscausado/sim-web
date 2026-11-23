import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('especialistas')
export class Especialistas {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @Column({ name: 'NOMBRE', type: 'char', length: 50 })
  nombre: string;

  @Column({ name: 'ESPECIALIDAD', type: 'char', length: 50 })
  especialidad: string;

  @Column({ name: 'REGISTRO_MEDICO', type: 'char', length: 100 })
  registroMedico: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'FIRMA', type: 'blob', nullable: true })
  firma?: Buffer | null;

  // ── Identificación y nombre estructurado: los exige PractitionerRDA / RETHUS ──
  @Column({ name: 'ID_TIPO_IDENTIFICACION', type: 'char', length: 2, nullable: true })
  idTipoIdentificacion?: string | null;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 50, nullable: true })
  identificacion?: string | null;

  @Column({ name: 'primer_nombre', type: 'varchar', length: 60, nullable: true })
  primerNombre?: string | null;

  @Column({ name: 'segundo_nombre', type: 'varchar', length: 60, nullable: true })
  segundoNombre?: string | null;

  @Column({ name: 'primer_apellido', type: 'varchar', length: 60, nullable: true })
  primerApellido?: string | null;

  @Column({ name: 'segundo_apellido', type: 'varchar', length: 60, nullable: true })
  segundoApellido?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
