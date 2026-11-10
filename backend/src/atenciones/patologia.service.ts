import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Patologia } from './entities/patologia.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import {
  DetalleOrden,
  EstadoDetalleOrden,
} from '../admisiones/entities/detalle-orden.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { Especialistas } from '../seguridad/entities/especialistas.entity';
import { UpsertPatologiaDto } from './dto/upsert-patologia.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import {
  guardarRegistro,
  hoyISO,
  horaActual,
  TABLA_REGISTRO,
} from '../common/registros.util';
import { htmlVacio } from '../reportes/html-pdf';
import { PatologiaPdfService } from './patologia-pdf.service';

const ESTADOS_CERRADOS = [
  EstadoOrden.ATENDIDO,
  EstadoOrden.CANCELADO,
  EstadoOrden.FACTURADO,
];

@Injectable()
export class PatologiaService {
  constructor(
    @InjectRepository(Patologia)
    private readonly patologiaRepository: Repository<Patologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(EstudiosGenerados)
    private readonly estudiosGeneradosRepository: Repository<EstudiosGenerados>,
    @InjectRepository(Especialistas)
    private readonly especialistasRepository: Repository<Especialistas>,
    private readonly dataSource: DataSource,
    private readonly pdfService: PatologiaPdfService,
  ) {}

  /** Equivalente a DPatologia.Cargar(): el informe (si existe) de una orden puntual. */
  async findByOrden(idOrden: number): Promise<Patologia | null> {
    return this.patologiaRepository.findOne({
      where: { idOrden },
      relations: [
        'diagnosticoCie10',
        'patologo',
        'orden',
        'orden.paciente',
        'orden.contrato',
        'orden.especimen',
      ],
    });
  }

  /**
   * Cola de trabajo de Patología: réplica de DOrdenes.ListarPatologias() del
   * VB.NET (frmPatologiaCD): ESTADO NOT IN ('ATENDIDO','CANCELADO','FACTURADO')
   * y tipo_estudio.PREFIJO NOT IN ('CV','CB') (las citologías van aparte).
   * No excluye las que ya tienen informe: se pueden seguir editando hasta firmar.
   */
  async findPendientes(idSede?: number, q?: string) {
    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .leftJoinAndSelect('o.sede', 'sede')
      .where('o.estado NOT IN (:...estadosExcluidos)', {
        estadosExcluidos: ESTADOS_CERRADOS,
      })
      .andWhere('tipoEstudio.prefijo NOT IN (:...prefijosExcluidos)', {
        prefijosExcluidos: ['CV', 'CB'],
      });

    if (idSede) qb.andWhere('o.idSede = :idSede', { idSede });

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(o.numeroOrden LIKE :term OR o.consecutivo LIKE :term OR paciente.identificacion LIKE :term ' +
          'OR paciente.primerNombre LIKE :term OR paciente.segundoNombre LIKE :term ' +
          'OR paciente.primerApellido LIKE :term OR paciente.segundoApellido LIKE :term)',
        { term },
      );
    }

    const ordenes = await qb
      .orderBy('o.fechaIngreso', 'ASC')
      .addOrderBy('o.id', 'ASC')
      .getMany();
    if (ordenes.length === 0) return [];

    const ids = ordenes.map((o) => o.id);
    const conInforme = await this.patologiaRepository
      .createQueryBuilder('p')
      .select('p.idOrden', 'idOrden')
      .where('p.idOrden IN (:...ids)', { ids })
      .getRawMany<{ idOrden: number }>();
    const idsConInforme = new Set(conInforme.map((r) => Number(r.idOrden)));

    return ordenes.map((o) => ({
      ...o,
      tieneInforme: idsConInforme.has(o.id),
    }));
  }

  /** Equivalente a DPatologia.ListarPatologiasPaciente(): resultados ya entregables de un paciente. */
  async findByPaciente(idUsuario: number) {
    return this.patologiaRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.orden', 'o')
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado IN (:...estados)', {
        estados: [EstadoOrden.ATENDIDO, EstadoOrden.FACTURADO],
      })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
  }

  /** DPatologia.ListarEstudiosAnteriores(): estudios ya firmados del paciente, del más reciente al más antiguo. */
  async estudiosAnteriores(idUsuario: number) {
    return this.patologiaRepository
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.orden', 'o')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado IN (:...estados)', {
        estados: [EstadoOrden.ATENDIDO, EstadoOrden.FACTURADO],
      })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
  }

  /**
   * bbiGuardar de frmPatologiaCD: DPatologia.Guardar() + ActualizarEspecimen()
   * + GuardarRegistro("5", orden, empleado, "Actualizacion", consecutivo).
   * Un estudio firmado (ATENDIDO/FACTURADO) ya no se puede modificar.
   */
  async upsert(
    dto: UpsertPatologiaDto,
    idEmpleado: number,
  ): Promise<Patologia> {
    const orden = await this.ordenesRepository.findOne({
      where: { id: dto.idOrden },
    });
    if (!orden)
      throw new NotFoundException(`Orden ${dto.idOrden} no encontrada`);
    if (ESTADOS_CERRADOS.includes(orden.estado)) {
      throw new ConflictException(
        `La orden ${orden.consecutivo} está en estado ${orden.estado}; el estudio ya no se puede modificar`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Patologia);
      let patologia = await repo.findOne({ where: { idOrden: dto.idOrden } });
      const campos = {
        tipoMuestra: dto.tipoMuestra.trim(),
        sitioLesion: (dto.sitioLesion ?? '').trim(),
        solicitado: (dto.solicitado ?? '').trim(),
        descripcionMacroscopica: (dto.descripcionMacroscopica ?? '').trim(),
        descripcionMicroscopica: (dto.descripcionMicroscopica ?? '').trim(),
        diagnostico: (dto.diagnostico ?? '').trim(),
        observaciones: (dto.observaciones ?? '').trim(),
        codigoDiagnostico: (dto.codigoDiagnostico ?? '').trim(),
        idEmpleado,
        fechaSalida: dto.fechaSalida ?? hoyISO(),
        estado: EstadoActivoInactivo.ACTIVO,
      };

      if (patologia) {
        Object.assign(patologia, campos, {
          codigoPatologia: dto.codigoPatologia ?? patologia.codigoPatologia,
        });
      } else {
        patologia = repo.create({
          idOrden: dto.idOrden,
          fecha: hoyISO(),
          ...campos,
          codigoPatologia: dto.codigoPatologia ?? null,
        });
      }
      const guardada = await repo.save(patologia);

      if (dto.idEspecimen && dto.idEspecimen !== orden.idEspecimen) {
        await manager
          .getRepository(Ordenes)
          .update({ id: orden.id }, { idEspecimen: dto.idEspecimen });
      }
      await guardarRegistro(
        manager,
        TABLA_REGISTRO.PATOLOGIA,
        orden.id,
        idEmpleado,
        'Actualizacion',
        orden.consecutivo,
      );
      return guardada;
    });
  }

  /**
   * chkProcesado + bbiGuardar de frmPatologiaCD: valida y firma el estudio.
   * - Mismas validaciones y mensajes del VB.NET.
   * - El usuario debe estar registrado como especialista (_DEspecialista.Existe).
   * - ordenes.ESTADO = 'ATENDIDO'; detalle_orden: DIAGNOSTICO1 = CIE10 y ESTADO = 'ATENDIDO'
   *   (ActualizarDiagnosticoyEstado2); se reconstruye impresion_patologia.
   */
  async firmar(idOrden: number, idEmpleado: number) {
    const orden = await this.ordenesRepository.findOne({
      where: { id: idOrden },
    });
    if (!orden) throw new NotFoundException(`Orden ${idOrden} no encontrada`);
    if (ESTADOS_CERRADOS.includes(orden.estado)) {
      throw new ConflictException(
        `La orden ${orden.consecutivo} ya está en estado ${orden.estado}`,
      );
    }
    const p = await this.patologiaRepository.findOne({ where: { idOrden } });
    if (!p)
      throw new BadRequestException(
        'Primero guarde el estudio antes de firmarlo',
      );

    const faltantes: string[] = [];
    if (!p.tipoMuestra?.trim())
      faltantes.push(
        'El Tipo de Muestra es obligatorio para poder firmar el estudio',
      );
    if (!p.descripcionMacroscopica?.trim())
      faltantes.push(
        'La descripcion Impresion Diagnostica es obligatoria para poder firmar el estudio',
      );
    if (!p.descripcionMicroscopica?.trim())
      faltantes.push(
        'El Resultado del Estudio es obligatorio para poder firmar el estudio',
      );
    if (htmlVacio(p.diagnostico))
      faltantes.push(
        'La descripcion del Estudio es obligatorio para poder firmar el estudio',
      );
    if (!p.codigoDiagnostico?.trim())
      faltantes.push('El Diagnostico CIE10 es Obligatorio');
    if (faltantes.length) throw new BadRequestException(faltantes);

    const especialista = await this.especialistasRepository.findOne({
      where: { idEspecialista: idEmpleado },
    });
    if (!especialista) {
      throw new BadRequestException(
        'Para firmar el estudio debe ingresar al sistema el especialista',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(Ordenes)
        .update({ id: idOrden }, { estado: EstadoOrden.ATENDIDO });
      await manager
        .getRepository(DetalleOrden)
        .update(
          {
            idOrden: String(idOrden),
            estado: Not(EstadoDetalleOrden.CANCELADO),
          },
          {
            diagnostico1: p.codigoDiagnostico,
            estado: EstadoDetalleOrden.ATENDIDO,
          },
        );
      await manager.getRepository(EstudiosGenerados).save(
        manager.getRepository(EstudiosGenerados).create({
          idOrden,
          idDetalleOrden: 0,
          fecha: hoyISO(),
          hora: horaActual(),
          estudio: 'PATOLOGIA',
          idEmpleado,
        }),
      );
      await guardarRegistro(
        manager,
        TABLA_REGISTRO.PATOLOGIA,
        idOrden,
        idEmpleado,
        'Firma',
        orden.consecutivo,
      );
    });
    // DImpresionPatologia.Eliminar + Guardar: la impresión queda "congelada" con lo firmado.
    await this.pdfService.prepararSnapshot(idOrden, true);
    return {
      idOrden,
      consecutivo: orden.consecutivo,
      estado: EstadoOrden.ATENDIDO,
      especialista: especialista.nombre,
    };
  }
}
