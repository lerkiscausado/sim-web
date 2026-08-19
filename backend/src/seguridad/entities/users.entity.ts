import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivoEliminado } from '../../common/enums/estado.enum';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'USUARIO', type: 'varchar', length: 60, nullable: true })
  usuario?: string | null;

  @Column({ name: 'PASS', type: 'varchar', length: 255, select: false })
  pass: string;

  @Column({ name: 'NUEVO', type: 'char', length: 1 })
  nuevo: string;

  @Column({ name: 'EDITAR', type: 'char', length: 1 })
  editar: string;

  @Column({ name: 'ANULAR', type: 'char', length: 1 })
  anular: string;

  @Column({ name: 'CONSULTAR', type: 'char', length: 1 })
  consultar: string;

  @Column({ name: 'ADJUNTOS', type: 'char', length: 1 })
  adjuntos: string;

  @Column({ name: 'AGENDA', type: 'char', length: 1 })
  agenda: string;

  @Column({ name: 'HISTORIA_CLINICA', type: 'char', length: 1 })
  historiaClinica: string;

  @Column({ name: 'HISTORIAS_ANTERIORES', type: 'char', length: 1 })
  historiasAnteriores: string;

  @Column({ name: 'HISTORIA_GRUPAL', type: 'char', length: 1 })
  historiaGrupal: string;

  @Column({ name: 'EVOLUCION_PACIENTE', type: 'char', length: 1 })
  evolucionPaciente: string;

  @Column({ name: 'PROGRAMACION_CIRUGIA', type: 'char', length: 1 })
  programacionCirugia: string;

  @Column({ name: 'CITOLOGIA', type: 'char', length: 1 })
  citologia: string;

  @Column({ name: 'PATOLOGIA', type: 'char', length: 1 })
  patologia: string;

  @Column({ name: 'ENDOSCOPIA', type: 'char', length: 1 })
  endoscopia: string;

  @Column({ name: 'ADJUNTAR_IMAGENES', type: 'char', length: 1 })
  adjuntarImagenes: string;

  @Column({ name: 'LISTADO_ORDENES', type: 'char', length: 1 })
  listadoOrdenes: string;

  @Column({ name: 'GENERAR_FACTURA', type: 'char', length: 1 })
  generarFactura: string;

  @Column({ name: 'RIPS', type: 'char', length: 1 })
  rips: string;

  @Column({ name: 'INVENTARIO', type: 'char', length: 1 })
  inventario: string;

  @Column({ name: 'NOMINA', type: 'char', length: 1 })
  nomina: string;

  @Column({ name: 'VISTA_PREVIA', type: 'char', length: 1 })
  vistaPrevia: string;

  @Column({ name: 'IMPRIMIR', type: 'char', length: 1 })
  imprimir: string;

  @Column({ name: 'INDICADORES_GESTION', type: 'char', length: 1 })
  indicadoresGestion: string;

  @Column({ name: 'USUARIOS', type: 'char', length: 1 })
  usuarios: string;

  @Column({ name: 'ENTIDADES', type: 'char', length: 1 })
  entidades: string;

  @Column({ name: 'SUB_ENTIDADES', type: 'char', length: 1 })
  subEntidades: string;

  @Column({ name: 'CONTRATOS', type: 'char', length: 1 })
  contratos: string;

  @Column({ name: 'TARIFAS', type: 'char', length: 1 })
  tarifas: string;

  @Column({ name: 'DETALLE_TARIFAS', type: 'char', length: 1 })
  detalleTarifas: string;

  @Column({ name: 'CARGOS', type: 'char', length: 1 })
  cargos: string;

  @Column({ name: 'ESPECIALIDADES', type: 'char', length: 1 })
  especialidades: string;

  @Column({ name: 'EMPLEADOS', type: 'char', length: 1 })
  empleados: string;

  @Column({ name: 'EXAMENES', type: 'char', length: 1 })
  examenes: string;

  @Column({ name: 'MEDICAMENTOS', type: 'char', length: 1 })
  medicamentos: string;

  @Column({ name: 'CUPS', type: 'char', length: 1 })
  cups: string;

  @Column({ name: 'CIE10', type: 'char', length: 1 })
  cie10: string;

  @Column({ name: 'TIPO_PATOLOGIA', type: 'char', length: 1 })
  tipoPatologia: string;

  @Column({ name: 'ESTUDIOS_PREDETERMINADOS', type: 'char', length: 1 })
  estudiosPredeterminados: string;

  @Column({ name: 'EQUIPOS_APOYO', type: 'char', length: 1 })
  equiposApoyo: string;

  @Column({ name: 'PROCEDIMIENTO_TERAPEUTICO', type: 'char', length: 1 })
  procedimientoTerapeutico: string;

  @Column({ name: 'ENCABEZADO_PIEDEPAGINA', type: 'char', length: 1 })
  encabezadoPiedepagina: string;

  @Column({ name: 'LOGO', type: 'char', length: 1 })
  logo: string;

  @Column({ name: 'FIRMA', type: 'char', length: 1 })
  firma: string;

  @Column({ name: 'USERS', type: 'char', length: 1 })
  users: string;

  @Column({ name: 'SEGURIDAD', type: 'char', length: 1 })
  seguridad: string;

  @Column({ name: 'PRIVILEGIOS', type: 'char', length: 1 })
  privilegios: string;

  @Column({ name: 'AYUDA_PRODUCTO', type: 'char', length: 1 })
  ayudaProducto: string;

  @Column({ name: 'SOPORTE_TECNICO', type: 'char', length: 1 })
  soporteTecnico: string;

  @Column({ name: 'TUTORIALES', type: 'char', length: 1 })
  tutoriales: string;

  @Column({ name: 'ACERCADE', type: 'char', length: 1 })
  acercade: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivoEliminado, nullable: true })
  estado?: EstadoActivoInactivoEliminado | null;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ADMIN', type: 'set', enum: ['1', '0'] })
  admin: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
