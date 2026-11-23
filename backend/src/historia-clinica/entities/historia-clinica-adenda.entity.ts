import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Adenda de una historia ya firmada (Resolución 3100): el texto original nunca
 * se modifica; las correcciones o aclaraciones se agregan aquí.
 */
@Entity('historia_clinica_adendas')
export class HistoriaClinicaAdenda {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'id_orden', type: 'int' })
  idOrden: number;

  @Column({ name: 'id_historia', type: 'int', nullable: true })
  idHistoria?: number | null;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  idUsuario?: number | null;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  /** La pone MySQL (DEFAULT CURRENT_TIMESTAMP). */
  @Column({ name: 'fecha_hora', type: 'datetime', insert: false, update: false })
  fechaHora: Date;
}
