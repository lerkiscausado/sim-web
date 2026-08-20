import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';
import { setColumnTransformer } from '../../common/transformers/set-column.transformer';

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

  @Column({ name: 'ESTADO', type: 'set', enum: EstadoActivoInactivo, transformer: setColumnTransformer })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
