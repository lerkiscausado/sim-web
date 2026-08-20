import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('licencias')
export class Licencias {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'CLIENTE', type: 'char', length: 50 })
  cliente: string;

  @Column({ name: 'FECHA_CONTRATACION', type: 'date' })
  fechaContratacion: string;

  @Column({ name: 'SERIAL', type: 'char', length: 100 })
  serial: string;

  @Column({ name: 'ID_ORIGEN', type: 'char', length: 50 })
  idOrigen: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: ['A', 'S', 'E'] })
  estado: string;

  @Column({ name: 'CODIGO_PRESTADOR', type: 'char', length: 15 })
  codigoPrestador: string;

  @Column({ name: 'TIPO_IDENTIFICACION', type: 'char', length: 3, nullable: true })
  tipoIdentificacion?: string | null;

  @Column({ name: 'IDENTIFICACION', type: 'char', length: 20, nullable: true })
  identificacion?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
