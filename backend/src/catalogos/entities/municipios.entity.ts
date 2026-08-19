import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('municipios')
export class Municipios {
  @PrimaryColumn({ name: 'CODIGO_MUNICIPIO', type: 'char', length: 3 })
  codigoMunicipio: string;

  @Column({ name: 'NOMBRE_MUNICIPIO', type: 'varchar', length: 50 })
  nombreMunicipio: string;

  @PrimaryColumn({ name: 'CODIGO_DEPARTAMENTO', type: 'char', length: 2 })
  codigoDepartamento: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
