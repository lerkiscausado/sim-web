import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('privilegios')
export class Privilegios {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ID_EMPLEADO', type: 'int' })
  idEmpleado: number;

  @Column({ name: 'ID_BOTON', type: 'int' })
  idBoton: number;

  @Column({ name: 'VISIBLE', type: 'smallint' })
  visible: number;

  @Column({ name: 'ACTIVO', type: 'smallint' })
  activo: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
