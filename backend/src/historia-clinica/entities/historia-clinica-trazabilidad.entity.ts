import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Acciones que registra la bitácora (mismas que el escritorio, DHistoriaClinica.vb). */
export type AccionTrazabilidad = 'CREACION' | 'ACTUALIZACION' | 'FIRMA' | 'INTENTO_BLOQUEADO' | 'ADENDA';

/**
 * Bitácora de inalterabilidad de la historia clínica (Resolución 3100).
 * Solo se inserta, nunca se modifica ni se borra.
 */
@Entity('historia_clinica_trazabilidad')
export class HistoriaClinicaTrazabilidad {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'id_orden', type: 'int' })
  idOrden: number;

  @Column({ name: 'id_historia', type: 'int', nullable: true })
  idHistoria?: number | null;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  idUsuario?: number | null;

  @Column({ name: 'accion', type: 'varchar', length: 30 })
  accion: AccionTrazabilidad;

  @Column({ name: 'detalle', type: 'varchar', length: 500, nullable: true })
  detalle?: string | null;

  /** La pone MySQL (DEFAULT CURRENT_TIMESTAMP): hora del servidor, no del navegador. */
  @Column({ name: 'fecha_hora', type: 'datetime', insert: false, update: false })
  fechaHora: Date;
}
