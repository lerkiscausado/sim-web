import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

@Entity('soporte')
export class Soporte {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @Column({ name: 'NOMBRE_USUARIO', type: 'char', length: 50 })
  nombreUsuario: string;

  @Column({ name: 'ASUNTO', type: 'text' })
  asunto: string;

  @Column({ name: 'DEPARTAMENTO', type: 'char', length: 50 })
  departamento: string;

  @Column({ name: 'ESTADO', type: 'set', enum: ['ABIERTO\'CANCELADO', 'CERRADO'], transformer: setColumnTransformer })
  estado: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
