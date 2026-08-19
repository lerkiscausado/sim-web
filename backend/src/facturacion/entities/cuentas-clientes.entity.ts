import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('cuentas_clientes')
export class CuentasClientes {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'ID_CLIENTE', type: 'int' })
  idCliente: number;

  @Column({ name: 'TIPO_DOCUMENTO', type: 'char', length: 2 })
  tipoDocumento: string;

  @Column({ name: 'NUMERO_DOCUMENTO', type: 'char', length: 50 })
  numeroDocumento: string;

  @Column({ name: 'FECHA', type: 'date' })
  fecha: string;

  @Column({ name: 'CONCEPTO', type: 'text', nullable: true })
  concepto?: string | null;

  @Column({ name: 'VALOR', type: 'double' })
  valor: number;

  @Column({ name: 'SALDO', type: 'double' })
  saldo: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
