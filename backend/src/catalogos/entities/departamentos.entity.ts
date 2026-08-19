import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('departamentos')
export class Departamentos {
  @PrimaryColumn({ name: 'CODIGO_DEPARTAMENTO', type: 'char', length: 2 })
  codigoDepartamento: string;

  @Column({ name: 'NOMBRE_DEPARTAMENTO', type: 'varchar', length: 50 })
  nombreDepartamento: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
