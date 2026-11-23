import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Especialistas } from './entities/especialistas.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { ActualizarEspecialistaRdaDto } from './dto/actualizar-especialista-rda.dto';

const mayus = (v?: string | null) => (v ?? '').trim().toUpperCase() || null;

@Injectable()
export class EspecialistasService {
  constructor(
    @InjectRepository(Especialistas)
    private readonly repo: Repository<Especialistas>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  /** Datos RDA del especialista cuyo ID_ESPECIALISTA es el id del empleado (así los enlaza el escritorio). */
  async datosRda(idEspecialista: number) {
    const e = await this.repo.findOne({ where: { idEspecialista } });
    if (!e) throw new NotFoundException('Este empleado no está registrado como especialista.');
    return {
      idEspecialista: e.idEspecialista,
      nombre: e.nombre,
      idTipoIdentificacion: e.idTipoIdentificacion ?? '',
      identificacion: (e.identificacion ?? '').trim(),
      primerNombre: e.primerNombre ?? '',
      segundoNombre: e.segundoNombre ?? '',
      primerApellido: e.primerApellido ?? '',
      segundoApellido: e.segundoApellido ?? '',
      completo: !!(e.idTipoIdentificacion && e.identificacion && e.primerNombre && e.primerApellido),
    };
  }

  async actualizarDatosRda(idEspecialista: number, dto: ActualizarEspecialistaRdaDto) {
    const e = await this.repo.findOne({ where: { idEspecialista } });
    if (!e) throw new NotFoundException('Este empleado no está registrado como especialista.');
    e.idTipoIdentificacion = dto.idTipoIdentificacion;
    e.identificacion = dto.identificacion.trim();
    e.primerNombre = mayus(dto.primerNombre);
    e.segundoNombre = mayus(dto.segundoNombre);
    e.primerApellido = mayus(dto.primerApellido);
    e.segundoApellido = mayus(dto.segundoApellido);
    await this.repo.save(e);
    return this.datosRda(idEspecialista);
  }
}
