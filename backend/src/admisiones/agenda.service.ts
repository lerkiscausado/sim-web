import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agenda, EstadoAgenda } from './entities/agenda.entity';
import { CitasCanceladas } from './entities/citas-canceladas.entity';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { CancelarCitaDto } from './dto/cancelar-cita.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda)
    private readonly agendaRepository: Repository<Agenda>,
    @InjectRepository(CitasCanceladas)
    private readonly citasCanceladasRepository: Repository<CitasCanceladas>,
  ) {}

  /** Agenda de un día, opcionalmente filtrada por especialista o sede vía contrato. */
  async findByDia(fecha: string, idEspecialista?: number) {
    return this.agendaRepository.find({
      where: {
        fecha,
        ...(idEspecialista ? { idEspecialista } : {}),
      },
      relations: ['paciente', 'especialista', 'tipoEstudio', 'empleado'],
      order: { hora: 'ASC' },
    });
  }

  async findOne(id: number) {
    const cita = await this.agendaRepository.findOne({
      where: { id },
      relations: ['paciente', 'especialista', 'tipoEstudio', 'empleado', 'orden', 'contrato'],
    });
    if (!cita) {
      throw new NotFoundException(`Cita de agenda ${id} no encontrada`);
    }
    return cita;
  }

  async create(dto: CreateAgendaDto) {
    const cita = this.agendaRepository.create({
      ...dto,
      estado: EstadoAgenda.DISPONIBLE,
    });
    return this.agendaRepository.save(cita);
  }

  async marcarAtendida(id: number) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoAgenda.CANCELADA) {
      throw new BadRequestException('No se puede atender una cita cancelada');
    }
    cita.estado = EstadoAgenda.ATENDIDA;
    return this.agendaRepository.save(cita);
  }

  /** Cancela la cita: registra el motivo en citas_canceladas y actualiza el estado en agenda. */
  async cancelar(id: number, dto: CancelarCitaDto) {
    const cita = await this.findOne(id);
    if (cita.estado === EstadoAgenda.ATENDIDA) {
      throw new BadRequestException('No se puede cancelar una cita ya atendida');
    }

    const registroCancelacion = this.citasCanceladasRepository.create({
      fecha: new Date().toISOString().slice(0, 10),
      idAgenda: cita.id,
      idMotivo: dto.idMotivo,
      motivo: dto.motivo,
      estado: EstadoActivoInactivo.ACTIVO,
    });
    await this.citasCanceladasRepository.save(registroCancelacion);

    cita.estado = EstadoAgenda.CANCELADA;
    return this.agendaRepository.save(cita);
  }
}
