import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AccionTrazabilidad } from '../../historia-clinica/entities/historia-clinica-trazabilidad.entity';

/** Bitácora de inalterabilidad de los estudios de endoscopia (Res. 3100, migración 007). Solo inserciones. */
@Entity('endoscopias_trazabilidad')
export class EndoscopiaTrazabilidad {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'id_orden', type: 'int' })
  idOrden: number;

  @Column({ name: 'id_endoscopia', type: 'int', nullable: true })
  idEndoscopia?: number | null;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  idUsuario?: number | null;

  @Column({ name: 'accion', type: 'varchar', length: 30 })
  accion: AccionTrazabilidad;

  @Column({ name: 'detalle', type: 'varchar', length: 500, nullable: true })
  detalle?: string | null;

  @Column({ name: 'fecha_hora', type: 'datetime', insert: false, update: false })
  fechaHora: Date;
}
