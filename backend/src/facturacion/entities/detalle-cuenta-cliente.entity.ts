import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('detalle_cuenta_cliente')
export class DetalleCuentaCliente {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_CUENTA_CLIENTE', type: 'int' })
  idCuentaCliente: number;

  @Column({ name: 'ID_RECIBO', type: 'int' })
  idRecibo: number;

  @Column({ name: 'VALOR', type: 'double' })
  valor: number;

  @Column({ name: 'SALDO', type: 'double' })
  saldo: number;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
