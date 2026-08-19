import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('impresion_historia')
export class ImpresionHistoria {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'NUMERO_HISTORIA', type: 'char', length: 50, nullable: true })
  numeroHistoria?: string | null;

  @Column({ name: 'NOMBRE', type: 'char', length: 100, nullable: true })
  nombre?: string | null;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 50, nullable: true })
  identificacion?: string | null;

  @Column({ name: 'EDAD', type: 'date', nullable: true })
  edad?: string | null;

  @Column({ name: 'SEXO', type: 'char', length: 10, nullable: true })
  sexo?: string | null;

  @Column({ name: 'ESTADO_CIVIL', type: 'char', length: 50, nullable: true })
  estadoCivil?: string | null;

  @Column({ name: 'TELEFONO', type: 'char', length: 50, nullable: true })
  telefono?: string | null;

  @Column({ name: 'DIRECCION', type: 'char', length: 100, nullable: true })
  direccion?: string | null;

  @Column({ name: 'ENTIDAD', type: 'char', length: 100, nullable: true })
  entidad?: string | null;

  @Column({ name: 'FECHA_INGRESO', type: 'date', nullable: true })
  fechaIngreso?: string | null;

  @Column({ name: 'FECHA_ATENCION', type: 'date', nullable: true })
  fechaAtencion?: string | null;

  @Column({ name: 'MOTIVO_CONSULTA', type: 'text', nullable: true })
  motivoConsulta?: string | null;

  @Column({ name: 'RESPONSABLES', type: 'char', length: 100, nullable: true })
  responsables?: string | null;

  @Column({ name: 'CONSULTA_CONTROL', type: 'text', nullable: true })
  consultaControl?: string | null;

  @Column({ name: 'ENFERMEDAD_ACTUAL', type: 'text', nullable: true })
  enfermedadActual?: string | null;

  @Column({ name: 'ANTECEDENTES_FAMILIARES', type: 'text', nullable: true })
  antecedentesFamiliares?: string | null;

  @Column({ name: 'ANTECEDENTES_PERSONALES', type: 'text', nullable: true })
  antecedentesPersonales?: string | null;

  @Column({ name: 'EXAMEN_FISICO', type: 'text', nullable: true })
  examenFisico?: string | null;

  @Column({ name: 'PESO', type: 'char', length: 10, nullable: true })
  peso?: string | null;

  @Column({ name: 'TALLA', type: 'char', length: 10, nullable: true })
  talla?: string | null;

  @Column({ name: 'TENSION_ARTERIAL', type: 'char', length: 10, nullable: true })
  tensionArterial?: string | null;

  @Column({ name: 'FRECUENCIA_RESPIRATORIA', type: 'char', length: 10, nullable: true })
  frecuenciaRespiratoria?: string | null;

  @Column({ name: 'FRECUENCIA_CARDIACA', type: 'char', length: 10, nullable: true })
  frecuenciaCardiaca?: string | null;

  @Column({ name: 'TEMPERATURA', type: 'char', length: 10, nullable: true })
  temperatura?: string | null;

  @Column({ name: 'TANNER_A', type: 'char', length: 10, nullable: true })
  tannerA?: string | null;

  @Column({ name: 'TANNER_B', type: 'char', length: 10, nullable: true })
  tannerB?: string | null;

  @Column({ name: 'TANNER_P', type: 'char', length: 10, nullable: true })
  tannerP?: string | null;

  @Column({ name: 'TANNER_VT', type: 'char', length: 10, nullable: true })
  tannerVt?: string | null;

  @Column({ name: 'TANNER_LP', type: 'char', length: 10, nullable: true })
  tannerLp?: string | null;

  @Column({ name: 'RECOMENDACIONES', type: 'text', nullable: true })
  recomendaciones?: string | null;

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

  @Column({ name: 'FIRMA', type: 'blob', nullable: true })
  firma?: Buffer | null;

  @Column({ name: 'MEDICO', type: 'char', length: 50, nullable: true })
  medico?: string | null;

  @Column({ name: 'ESPECIALIDAD', type: 'char', length: 100, nullable: true })
  especialidad?: string | null;

  @Column({ name: 'REGISTRO_MEDICO', type: 'char', length: 50, nullable: true })
  registroMedico?: string | null;

  @Column({ name: 'ID_EMPLEADO', type: 'int', nullable: true })
  idEmpleado?: number | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
