import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('encabezados')
export class Encabezados {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'RAZON_SOCIAL', type: 'char', length: 100 })
  razonSocial: string;

  @Column({ name: 'DESCRIPCION', type: 'text' })
  descripcion: string;

  @Column({ name: 'SERVICIOS', type: 'char', length: 100 })
  servicios: string;

  @Column({ name: 'DIRECCION', type: 'char', length: 100 })
  direccion: string;

  @Column({ name: 'TELEFONO', type: 'char', length: 50 })
  telefono: string;

  @Column({ name: 'CORREO', type: 'varchar', length: 100, nullable: true })
  correo?: string | null;

  @Column({ name: 'PAGINA_WEB', type: 'varchar', length: 100, nullable: true })
  paginaWeb?: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
