import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('impresion_endoscopia')
export class ImpresionEndoscopia {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'ESTUDIO', type: 'char', length: 50, nullable: true })
  estudio?: string | null;

  @Column({ name: 'FECHA_INGRESO', type: 'date', nullable: true })
  fechaIngreso?: string | null;

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

  @Column({ name: 'MEDICO_SOLICITA', type: 'char', length: 50, nullable: true })
  medicoSolicita?: string | null;

  @Column({ name: 'INDICACION', type: 'char', length: 100, nullable: true })
  indicacion?: string | null;

  @Column({ name: 'MEDICAMENTOS', type: 'char', length: 100, nullable: true })
  medicamentos?: string | null;

  @Column({ name: 'EQUIPO', type: 'char', length: 50, nullable: true })
  equipo?: string | null;

  @Column({ name: 'ANESTESIOLOGO', type: 'char', length: 50, nullable: true })
  anestesiologo?: string | null;

  @Column({ name: 'PROCEDIMIENTO_TERAPEUTICO', type: 'char', length: 100, nullable: true })
  procedimientoTerapeutico?: string | null;

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

  @Column({ name: 'DIAGNOSTICO', type: 'text', nullable: true })
  diagnostico?: string | null;

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

  @Column({ name: 'IMAGEN1', type: 'blob', nullable: true })
  imagen1?: Buffer | null;

  @Column({ name: 'IMAGEN2', type: 'blob', nullable: true })
  imagen2?: Buffer | null;

  @Column({ name: 'IMAGEN3', type: 'blob', nullable: true })
  imagen3?: Buffer | null;

  @Column({ name: 'IMAGEN4', type: 'blob', nullable: true })
  imagen4?: Buffer | null;

  @Column({ name: 'IMAGEN5', type: 'blob', nullable: true })
  imagen5?: Buffer | null;

  @Column({ name: 'IMAGEN6', type: 'blob', nullable: true })
  imagen6?: Buffer | null;

  @Column({ name: 'IMAGEN7', type: 'blob', nullable: true })
  imagen7?: Buffer | null;

  @Column({ name: 'IMAGEN8', type: 'blob', nullable: true })
  imagen8?: Buffer | null;

  @Column({ name: 'IMAGEN9', type: 'blob', nullable: true })
  imagen9?: Buffer | null;

  @Column({ name: 'TEXTO1', type: 'char', length: 100, nullable: true })
  texto1?: string | null;

  @Column({ name: 'TEXTO2', type: 'char', length: 100, nullable: true })
  texto2?: string | null;

  @Column({ name: 'TEXTO3', type: 'char', length: 100, nullable: true })
  texto3?: string | null;

  @Column({ name: 'TEXTO4', type: 'char', length: 100, nullable: true })
  texto4?: string | null;

  @Column({ name: 'TEXTO5', type: 'char', length: 100, nullable: true })
  texto5?: string | null;

  @Column({ name: 'TEXTO6', type: 'char', length: 100, nullable: true })
  texto6?: string | null;

  @Column({ name: 'TEXTO7', type: 'char', length: 100, nullable: true })
  texto7?: string | null;

  @Column({ name: 'TEXTO8', type: 'char', length: 100, nullable: true })
  texto8?: string | null;

  @Column({ name: 'TEXTO9', type: 'char', length: 100, nullable: true })
  texto9?: string | null;

  @Column({ name: 'NUMERO_FOTOS', type: 'int' })
  numeroFotos: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
