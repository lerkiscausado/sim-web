import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { Ordenes } from '../../admisiones/entities/ordenes.entity';
import { DetalleOrden } from '../../admisiones/entities/detalle-orden.entity';

@Entity('imagenes')
export class Imagenes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @ManyToOne(() => Ordenes)
  @JoinColumn({ name: 'ID_ORDEN' })
  orden?: Ordenes;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @ManyToOne(() => DetalleOrden)
  @JoinColumn({ name: 'ID_DETALLE_ORDEN' })
  detalleOrden?: DetalleOrden;

  @Column({ name: 'RUTA', type: 'char', length: 250 })
  ruta: string;

  @Column({ name: 'TEXTO', type: 'char', length: 100, nullable: true })
  texto?: string | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
