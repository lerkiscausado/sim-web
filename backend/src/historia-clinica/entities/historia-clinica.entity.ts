import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('historia_clinica')
export class HistoriaClinica {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'FECHA_HISTORIA', type: 'date', nullable: true })
  fechaHistoria?: string | null;

  @Column({ name: 'CODIGO_HISTORIA', type: 'char', length: 30, nullable: true })
  codigoHistoria?: string | null;

  @Column({ name: 'RESPONSABLES', type: 'varchar', length: 100, nullable: true })
  responsables?: string | null;

  @Column({ name: 'MOTIVO_CONSULTA', type: 'text', nullable: true })
  motivoConsulta?: string | null;

  @Column({ name: 'CONSULTA_CONTROL', type: 'text', nullable: true })
  consultaControl?: string | null;

  @Column({ name: 'ENFERMEDAD_ACTUAL', type: 'text', nullable: true })
  enfermedadActual?: string | null;

  @Column({ name: 'EXAMEN_FISICO', type: 'text', nullable: true })
  examenFisico?: string | null;

  @Column({ name: 'PESO', type: 'double', nullable: true })
  peso?: number | null;

  @Column({ name: 'TALLA', type: 'double', nullable: true })
  talla?: number | null;

  @Column({ name: 'TENSION_ARTERIAL', type: 'char', length: 10, nullable: true })
  tensionArterial?: string | null;

  @Column({ name: 'FRECUENCIA_CARDIACA', type: 'char', length: 6, nullable: true })
  frecuenciaCardiaca?: string | null;

  @Column({ name: 'FRECUENCIA_RESPIRATORIA', type: 'char', length: 6, nullable: true })
  frecuenciaRespiratoria?: string | null;

  @Column({ name: 'DIAGNOSTICO', type: 'text', nullable: true })
  diagnostico?: string | null;

  @Column({ name: 'PLAN_SEGUIR', type: 'text', nullable: true })
  planSeguir?: string | null;

  @Column({ name: 'FORMULACION', type: 'text', nullable: true })
  formulacion?: string | null;

  @Column({ name: 'LABORATORIOS', type: 'text', nullable: true })
  laboratorios?: string | null;

  @Column({ name: 'OTROS_ESTUDIOS', type: 'text', nullable: true })
  otrosEstudios?: string | null;

  @Column({ name: 'TANNER_A', type: 'set', enum: ['-', '1', '2', '3', '4', '5'], nullable: true })
  tannerA?: string | null;

  @Column({ name: 'TANNER_B', type: 'set', enum: ['-', '1', '2', '3', '4', '5'], nullable: true })
  tannerB?: string | null;

  @Column({ name: 'TANNER_P', type: 'set', enum: ['-', '1', '2', '3', '4', '5'], nullable: true })
  tannerP?: string | null;

  @Column({ name: 'TANNER_VT', type: 'set', enum: ['-', '1', '2', '3', '4', '5', '6', '8', '10', '12', '15', '20', '25'], nullable: true })
  tannerVt?: string | null;

  @Column({ name: 'TANNER_LP', type: 'varchar', length: 10, nullable: true })
  tannerLp?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: ['A', 'C'], nullable: true })
  estado?: string | null;

  @Column({ name: 'RECOMENDACIONES', type: 'text', nullable: true })
  recomendaciones?: string | null;

  @Column({ name: 'TEMPERATURA', type: 'char', length: 10, nullable: true })
  temperatura?: string | null;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
