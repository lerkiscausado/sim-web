import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoIdentificacion } from '../../catalogos/entities/tipo-identificacion.entity';
import { TipoUsuario } from '../../catalogos/entities/tipo-usuario.entity';

@Entity('usuarios')
export class Usuarios {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_TIPO_IDENTIFICACION', type: 'char', length: 2 })
  idTipoIdentificacion: string;

  @ManyToOne(() => TipoIdentificacion)
  @JoinColumn({ name: 'ID_TIPO_IDENTIFICACION' })
  tipoIdentificacion?: TipoIdentificacion;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 150 })
  identificacion: string;

  @Column({ name: 'PRIMER_NOMBRE', type: 'char', length: 150 })
  primerNombre: string;

  @Column({ name: 'SEGUNDO_NOMBRE', type: 'char', length: 150, nullable: true })
  segundoNombre?: string | null;

  @Column({ name: 'PRIMER_APELLIDO', type: 'char', length: 150 })
  primerApellido: string;

  @Column({ name: 'SEGUNDO_APELLIDO', type: 'char', length: 150, nullable: true })
  segundoApellido?: string | null;

  @Column({ name: 'SEXO', type: 'set', enum: ['M', 'F'] })
  sexo: string;

  @Column({ name: 'FECHA_NACIMIENTO', type: 'date' })
  fechaNacimiento: string;

  @Column({ name: 'CIUDAD_NACIMIENTO', type: 'char', length: 50, nullable: true })
  ciudadNacimiento?: string | null;

  @Column({ name: 'PAIS_NACIMIENTO', type: 'char', length: 50, nullable: true })
  paisNacimiento?: string | null;

  @Column({ name: 'DIRECCION', type: 'varchar', length: 300, nullable: true })
  direccion?: string | null;

  @Column({ name: 'TELEFONO', type: 'varchar', length: 150, nullable: true })
  telefono?: string | null;

  @Column({ name: 'CORREO_ELECTRONICO', type: 'varchar', length: 750, nullable: true })
  correoElectronico?: string | null;

  @Column({ name: 'ESTADO_CIVIL', type: 'set', enum: ['CASADO', 'SOLTERO', 'DIVORCIADO', 'VIUDO', 'UNION LIBRE'] })
  estadoCivil: string;

  @Column({ name: 'ZONA', type: 'set', enum: ['R', 'U'], nullable: true })
  zona?: string | null;

  // NOTA: no se declara relación formal con `municipios` porque su PK es
  // compuesta (CODIGO_MUNICIPIO + CODIGO_DEPARTAMENTO) y aquí solo se guarda
  // el código de municipio suelto (dato legado). Queda como texto libre.
  @Column({ name: 'CODIGO_MUNICIPIO', type: 'char', length: 45, nullable: true })
  codigoMunicipio?: string | null;

  @Column({ name: 'CODIGO_TIPO_USUARIO', type: 'int' })
  codigoTipoUsuario: number;

  @ManyToOne(() => TipoUsuario)
  @JoinColumn({ name: 'CODIGO_TIPO_USUARIO' })
  tipoUsuario?: TipoUsuario;

  @Column({ name: 'CARNET', type: 'char', length: 150, nullable: true })
  carnet?: string | null;

  @Column({ name: 'FOTO', type: 'blob' })
  foto: Buffer;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
