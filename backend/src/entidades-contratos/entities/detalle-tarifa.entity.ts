import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('detalle_tarifa')
export class DetalleTarifa {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_TARIFA', type: 'char', length: 50 })
  idTarifa: string;

  @Column({ name: 'CODIGO_PROCEDIMIENTO', type: 'char', length: 50 })
  codigoProcedimiento: string;

  @Column({ name: 'ID_TIPO_ESTUDIO', type: 'int' })
  idTipoEstudio: number;

  @Column({ name: 'CODIGO_CUPS', type: 'char', length: 12 })
  codigoCups: string;

  @Column({ name: 'VALOR', type: 'bigint' })
  valor: number;

  @Column({ name: 'DESCUENTO', type: 'int' })
  descuento: number;

  @Column({ name: 'TIPO_ATENCION', type: 'enum', enum: ['CONSULTA', 'PROCEDIMIENTO'] })
  tipoAtencion: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
