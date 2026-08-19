import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('imagenes_temporales')
export class ImagenesTemporales {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_DETALLE_ORDEN', type: 'int' })
  idDetalleOrden: number;

  @Column({ name: 'IMAGEN', type: 'blob' })
  imagen: Buffer;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
