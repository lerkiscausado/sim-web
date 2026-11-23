import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Adenda sobre un estudio de endoscopia firmado (Res. 3100, migración 007). */
@Entity('endoscopias_adendas')
export class EndoscopiaAdenda {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'id_orden', type: 'int' })
  idOrden: number;

  @Column({ name: 'id_endoscopia', type: 'int' })
  idEndoscopia: number;

  @Column({ name: 'id_usuario', type: 'int', nullable: true })
  idUsuario?: number | null;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  @Column({ name: 'fecha_hora', type: 'datetime', insert: false, update: false })
  fechaHora: Date;
}
