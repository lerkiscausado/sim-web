import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('antecedentes')
export class Antecedentes {
  @PrimaryColumn({ name: 'ID_ORDEN', type: 'int' })
  idOrden: number;

  @Column({ name: 'ID_USUARIO', type: 'int' })
  idUsuario: number;

  @Column({ name: 'ANTECEDENTES_FAMILIARES', type: 'text' })
  antecedentesFamiliares: string;

  @Column({ name: 'ANTECEDENTES_PERSONALES', type: 'text' })
  antecedentesPersonales: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
