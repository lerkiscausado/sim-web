import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('presentacion_productos')
export class PresentacionProductos {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_PRODUCTO', type: 'int' })
  idProducto: number;

  @Column({ name: 'ID_MARCA', type: 'int' })
  idMarca: number;

  @Column({ name: 'PRESENTACION', type: 'char', length: 100 })
  presentacion: string;

  @Column({ name: 'ID_UNIDAD_MEDIDA', type: 'int' })
  idUnidadMedida: number;

  @Column({ name: 'CANTIDAD', type: 'double' })
  cantidad: number;

  @Column({ name: 'CODIGO_BARRA', type: 'char', length: 14 })
  codigoBarra: string;

  @Column({ name: 'FOTO_PRODUCTO', type: 'blob', nullable: true })
  fotoProducto?: Buffer | null;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @Column({ name: 'FOTO', type: 'blob', nullable: true })
  foto?: Buffer | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
