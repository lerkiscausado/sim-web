import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { EstadoActivoInactivo } from '../../common/enums/estado.enum';

@Entity('consentimiento_informado_plantillas')
export class ConsentimientoInformadoPlantillas {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ID_LICENCIA', type: 'int' })
  idLicencia: number;

  @Column({ name: 'TIPO_CONSENTIMIENTO', type: 'enum', enum: ['TELEMEDICINA', 'PROCEDIMIENTO'] })
  tipoConsentimiento: string;

  @Column({ name: 'DESCRIPCION', type: 'text' })
  descripcion: string;

  @Column({ name: 'ESTADO', type: 'enum', enum: EstadoActivoInactivo })
  estado: EstadoActivoInactivo;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
