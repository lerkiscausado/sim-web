import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('proveedores')
export class Proveedores {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_TIPO_IDENTIFICACION', type: 'char', length: 2 })
  idTipoIdentificacion: string;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 50 })
  identificacion: string;

  @Column({ name: 'NOMBRE', type: 'char', length: 100 })
  nombre: string;

  @Column({ name: 'DIRECCION', type: 'char', length: 100 })
  direccion: string;

  @Column({ name: 'TELEFONO', type: 'char', length: 50 })
  telefono: string;

  @Column({ name: 'CORREO_ELECTRONICO', type: 'char', length: 200 })
  correoElectronico: string;

  @Column({ name: 'CONTACTO', type: 'char', length: 100 })
  contacto: string;

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
