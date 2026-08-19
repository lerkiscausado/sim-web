import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('optometria')
export class Optometria {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'FECHA_HISTORIA', type: 'date' })
  fechaHistoria: string;

  @Column({ name: 'MOTIVO_CONSULTA', type: 'text' })
  motivoConsulta: string;

  @Column({ name: 'RESPONSABLES', type: 'char', length: 100 })
  responsables: string;

  @Column({ name: 'OCUPACION', type: 'char', length: 50, nullable: true })
  ocupacion?: string | null;

  @Column({ name: 'RX_USO', type: 'text' })
  rxUso: string;

  @Column({ name: 'ANTECEDENTES', type: 'text' })
  antecedentes: string;

  @Column({ name: 'AV_VL', type: 'char', length: 200 })
  avVl: string;

  @Column({ name: 'AV_VP', type: 'char', length: 200 })
  avVp: string;

  @Column({ name: 'REFRACCION_ESTATICA', type: 'char', length: 200 })
  refraccionEstatica: string;

  @Column({ name: 'DISTANCIA_PUPILAR', type: 'char', length: 50 })
  distanciaPupilar: string;

  @Column({ name: 'SUBJETIVO', type: 'char', length: 100 })
  subjetivo: string;

  @Column({ name: 'COVER_TEST', type: 'char', length: 50 })
  coverTest: string;

  @Column({ name: 'MODO_USO', type: 'char', length: 50 })
  modoUso: string;

  @Column({ name: 'LENSOMETRIA', type: 'char', length: 50 })
  lensometria: string;

  @Column({ name: 'AVF', type: 'char', length: 50 })
  avf: string;

  @Column({ name: 'DIAGNOSTICO', type: 'text' })
  diagnostico: string;

  @Column({ name: 'OTROS_HALLAZGOS', type: 'text' })
  otrosHallazgos: string;

  @Column({ name: 'CIE10', type: 'char', length: 10 })
  cie10: string;

  @Column({ name: 'CONDUCTA', type: 'text' })
  conducta: string;

  @Column({ name: 'ID_ESPECIALISTA', type: 'int' })
  idEspecialista: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
