import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('productos')
export class Productos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'PRESENTACION', type: 'char', length: 100 })
  presentacion: string;

  @Column({ name: 'ID_UNIDAD_MEDIDA', type: 'int' })
  idUnidadMedida: number;

  @Column({ name: 'CANTIDAD', type: 'int' })
  cantidad: number;

  @Column({ name: 'CODIGO_BARRA', type: 'char', length: 14 })
  codigoBarra: string;

  @Column({ name: 'FOTO_PRODUCTO', type: 'char', length: 200, nullable: true })
  fotoProducto?: string | null;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @Column({ name: 'FOTO', type: 'blob', nullable: true })
  foto?: Buffer | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
