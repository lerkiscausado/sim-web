import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('ortodoncia')
export class Ortodoncia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'HORA', type: 'time' })
  hora: string;

  @Column({ name: 'MOTIVO_CONSULTA', type: 'text' })
  motivoConsulta: string;

  @Column({ name: 'RESPONSABLES', type: 'text' })
  responsables: string;

  @Column({ name: 'ANTECEDENTES_PATOLOGICOS', type: 'text' })
  antecedentesPatologicos: string;

  @Column({ name: 'PERFIL', type: 'set', enum: ['RECTO', 'CONCAVO', 'CONVEXO'], transformer: setColumnTransformer })
  perfil: string;

  @Column({ name: 'FRENTE', type: 'set', enum: ['DEXTROGNATISMO', 'LEVOGNATISMO'], transformer: setColumnTransformer })
  frente: string;

  @Column({ name: 'HIPOTONIA', type: 'set', enum: ['SUPERIOR', 'INFERIOR'], transformer: setColumnTransformer })
  hipotonia: string;

  @Column({ name: 'HIPERTONIA', type: 'set', enum: ['SUPERIOR', 'INFERIOR'], transformer: setColumnTransformer })
  hipertonia: string;

  @Column({ name: 'MACROQUELIA', type: 'set', enum: ['SUPERIOR', 'INFERIOR'], transformer: setColumnTransformer })
  macroquelia: string;

  @Column({ name: 'MICROQUELIA', type: 'set', enum: ['SUPERIOR', 'INFERIOR'], transformer: setColumnTransformer })
  microquelia: string;

  @Column({ name: 'PROQUELIA', type: 'set', enum: ['SUPERIOR', 'INFERIOR'], transformer: setColumnTransformer })
  proquelia: string;

  @Column({ name: 'FRENILLO_LABIAL_SUPERIOR', type: 'set', enum: ['NORMAL', 'SOBREINSERTADO'], transformer: setColumnTransformer })
  frenilloLabialSuperior: string;

  @Column({ name: 'FRENILLO_LABIAL_INFERIOR', type: 'set', enum: ['NORMAL', 'SOBREINSERTADO'], transformer: setColumnTransformer })
  frenilloLabialInferior: string;

  @Column({ name: 'FRENILLO_LINGUAL', type: 'set', enum: ['NORMAL', 'SOBREINSERTADO'], transformer: setColumnTransformer })
  frenilloLingual: string;

  @Column({ name: 'RESPIRACION_BUCAL', type: 'char', length: 1 })
  respiracionBucal: string;

  @Column({ name: 'USO_CHUPO', type: 'char', length: 1 })
  usoChupo: string;

  @Column({ name: 'BRUXOMANIA', type: 'char', length: 1 })
  bruxomania: string;

  @Column({ name: 'SUCCION_DIGITAL', type: 'char', length: 1 })
  succionDigital: string;

  @Column({ name: 'SUCCION_LABIAL', type: 'char', length: 1 })
  succionLabial: string;

  @Column({ name: 'DEGLUCION_INFANTIL', type: 'char', length: 1 })
  deglucionInfantil: string;

  @Column({ name: 'ONICOFAGIA', type: 'char', length: 1 })
  onicofagia: string;

  @Column({ name: 'EMPUJE_LINGUAL', type: 'char', length: 1 })
  empujeLingual: string;

  @Column({ name: 'MORDER_OBJETO', type: 'char', length: 1 })
  morderObjeto: string;

  @Column({ name: 'EVALUACION_HABITO', type: 'text' })
  evaluacionHabito: string;

  @Column({ name: 'FONACION', type: 'text' })
  fonacion: string;

  @Column({ name: 'INTERPRETACION_CEFALOMETRICA', type: 'text' })
  interpretacionCefalometrica: string;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'PRONOSTICO', type: 'text' })
  pronostico: string;

  @Column({ name: 'PLAN_TRATAMIENTO', type: 'text' })
  planTratamiento: string;

  @Column({ name: 'APARATOLOGIA', type: 'text' })
  aparatologia: string;

  @Column({ name: 'PRESUPUESTO', type: 'text' })
  presupuesto: string;

  @Column({ name: 'ACTIVIDAD_REALIZADA', type: 'text' })
  actividadRealizada: string;

  @Column({ name: 'PROXIMA_CITA', type: 'text' })
  proximaCita: string;

  @Column({ name: 'CODIGO_DIAGNOSTICO', type: 'char', length: 10 })
  codigoDiagnostico: string;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
