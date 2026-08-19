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
import { TipoEstudio } from '../../catalogos/entities/tipo-estudio.entity';
import { Especialistas } from '../../seguridad/entities/especialistas.entity';

@Entity('plantillas_informes')
export class PlantillasInformes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @ManyToOne(() => TipoEstudio)
  @JoinColumn({ name: 'ID_TIPO_ESTUDIO' })
  tipoEstudio?: TipoEstudio;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @ManyToOne(() => Especialistas)
  @JoinColumn({ name: 'ID_ESPECIALISTA' })
  especialista?: Especialistas;

  @Column({ name: 'CAMPO1', type: 'text', nullable: true })
  campo1?: string | null;

  @Column({ name: 'CAMPO2', type: 'text', nullable: true })
  campo2?: string | null;

  @Column({ name: 'CAMPO3', type: 'text', nullable: true })
  campo3?: string | null;

  @Column({ name: 'CAMPO4', type: 'text', nullable: true })
  campo4?: string | null;

  @Column({ name: 'CAMPO5', type: 'text', nullable: true })
  campo5?: string | null;

  @Column({ name: 'CAMPO6', type: 'text', nullable: true })
  campo6?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
