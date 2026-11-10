import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Citologia } from './entities/citologia.entity';
import { Ordenes, EstadoOrden } from '../admisiones/entities/ordenes.entity';
import {
  DetalleOrden,
  EstadoDetalleOrden,
} from '../admisiones/entities/detalle-orden.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { Especialistas } from '../seguridad/entities/especialistas.entity';
import { UpsertCitologiaDto } from './dto/upsert-citologia.dto';
import { CAMPOS_CHECK_CITOLOGIA, aApi, aBd } from './citologia-campos';
import {
  guardarRegistro,
  hoyISO,
  horaActual,
  TABLA_REGISTRO,
} from '../common/registros.util';

/** CUPS de citología cérvico-uterina que exige el filtro real (convencional / base líquida). */
const CUPS_CITOLOGIA = ['898001', '898002'];
const ESTADOS_CERRADOS = [
  EstadoOrden.ATENDIDO,
  EstadoOrden.CANCELADO,
  EstadoOrden.FACTURADO,
];

/** Devuelve la citología con las casillas en el formato de la API ('1'/'0'). */
function paraApi<T extends Citologia | null>(c: T): T {
  if (!c) return c;
  const out = { ...c } as Record<string, unknown>;
  for (const k of CAMPOS_CHECK_CITOLOGIA) out[k] = aApi(out[k] as string);
  return out as T;
}

@Injectable()
export class CitologiaService {
  constructor(
    @InjectRepository(Citologia)
    private readonly citologiaRepository: Repository<Citologia>,
    @InjectRepository(Ordenes)
    private readonly ordenesRepository: Repository<Ordenes>,
    @InjectRepository(Especialistas)
    private readonly especialistasRepository: Repository<Especialistas>,
    private readonly dataSource: DataSource,
  ) {}

  /** Equivalente a DCitologia.Cargar(): el informe (si existe) de una orden puntual. */
  async findByOrden(idOrden: number): Promise<Citologia | null> {
    const c = await this.citologiaRepository.findOne({
      where: { idOrden },
      relations: ['orden', 'orden.paciente', 'orden.contrato'],
    });
    return paraApi(c);
  }

  /**
   * Cola de trabajo de Citología: réplica de DOrdenes.ListarCitologias()
   * (frmCitologiaGeneral): PREFIJO IN ('CV','CB','CR'), ESTADO NOT IN
   * ('ATENDIDO','CANCELADO','FACTURADO') y una línea de detalle con CUPS
   * 898001 (convencional) u 898002 (base líquida).
   */
  async findPendientes(q?: string) {
    const qb = this.ordenesRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.paciente', 'paciente')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .leftJoinAndSelect('o.sede', 'sede')
      .innerJoin('detalle_orden', 'd', 'd.ID_ORDEN = o.ID')
      .where('tipoEstudio.prefijo IN (:...prefijos)', {
        prefijos: ['CV', 'CB', 'CR'],
      })
      .andWhere('o.estado NOT IN (:...estadosExcluidos)', {
        estadosExcluidos: ESTADOS_CERRADOS,
      })
      .andWhere('d.CODIGO_CUPS IN (:...cupsCitologia)', {
        cupsCitologia: CUPS_CITOLOGIA,
      });

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(o.numeroOrden LIKE :term OR o.consecutivo LIKE :term OR paciente.identificacion LIKE :term ' +
          'OR paciente.primerNombre LIKE :term OR paciente.segundoNombre LIKE :term ' +
          'OR paciente.primerApellido LIKE :term OR paciente.segundoApellido LIKE :term)',
        { term },
      );
    }

    const ordenes = await qb.orderBy('o.fechaIngreso', 'ASC').getMany();
    if (ordenes.length === 0) return [];

    const ids = ordenes.map((o) => o.id);
    const conInforme = await this.citologiaRepository
      .createQueryBuilder('c')
      .select('c.idOrden', 'idOrden')
      .where('c.idOrden IN (:...ids)', { ids })
      .getRawMany<{ idOrden: number }>();
    const idsConInforme = new Set(conInforme.map((r) => Number(r.idOrden)));

    return ordenes.map((o) => ({
      ...o,
      tieneInforme: idsConInforme.has(o.id),
    }));
  }

  /** DOrdenes.ListarEstudiosAnteriores(): citologías ya firmadas del paciente. */
  async estudiosAnteriores(idUsuario: number) {
    const lista = await this.citologiaRepository
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.orden', 'o')
      .leftJoinAndSelect('o.especimen', 'especimen')
      .leftJoinAndSelect('o.tipoEstudio', 'tipoEstudio')
      .where('o.idUsuario = :idUsuario', { idUsuario })
      .andWhere('o.estado IN (:...estados)', {
        estados: [EstadoOrden.ATENDIDO, EstadoOrden.FACTURADO],
      })
      .orderBy('o.fechaIngreso', 'DESC')
      .getMany();
    return lista.map(paraApi);
  }

  /** DCitologia.Guardar(): crea o actualiza la citología de la orden. */
  async upsert(
    dto: UpsertCitologiaDto,
    idEmpleado: number,
  ): Promise<Citologia> {
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

    const guardada = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Citologia);
      const { idOrden, ...resto } = dto;
      delete (resto as { fechaSalida?: string }).fechaSalida;
      const campos: Record<string, unknown> = { ...resto };
      for (const k of CAMPOS_CHECK_CITOLOGIA) {
        if (k in campos || k === 'acg6' || k === 'acg7')
          campos[k] = aBd(campos[k] as string);
      }
      campos.observaciones = (dto.observaciones ?? '').trim();
      campos.diagnostico = (dto.diagnostico ?? '').trim();

      let citologia = await repo.findOne({ where: { idOrden } });
      if (citologia) {
        Object.assign(citologia, campos, { idEmpleado });
      } else {
        const vacias = Object.fromEntries(
          CAMPOS_CHECK_CITOLOGIA.map((k) => [k, '']),
        );
        citologia = repo.create({
          idOrden,
          fecha: hoyISO(),
          ...vacias,
          ...campos,
          img1: '',
          img2: '',
          idEmpleado,
        } as Partial<Citologia>);
      }
      const r = await repo.save(citologia);
      await guardarRegistro(
        manager,
        TABLA_REGISTRO.CITOLOGIA,
        idOrden,
        idEmpleado,
        'Actualizacion',
        orden.consecutivo,
      );
      return r;
    });
    return paraApi(guardada);
  }

  /**
   * chkFirmarEstudio + bbiGuardar de frmCitologiaGeneral: el usuario debe ser
   * especialista; la orden y su detalle pasan a ATENDIDO
   * (ActualizarEstado + ActualizarEstadoOrden) y se registra el estudio generado.
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
    const c = await this.citologiaRepository.findOne({ where: { idOrden } });
    if (!c)
      throw new BadRequestException(
        'Primero guarde el estudio antes de firmarlo',
      );
    if (!c.diagnostico?.trim())
      throw new BadRequestException(
        'El diagnóstico es obligatorio para firmar el estudio',
      );

    const especialista = await this.especialistasRepository.findOne({
      where: { idEspecialista: idEmpleado },
    });
    if (!especialista)
      throw new BadRequestException(
        'Para firmar el estudio debe ingresar al sistema el especialista',
      );

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
          { estado: EstadoDetalleOrden.ATENDIDO },
        );
      const eg = manager.getRepository(EstudiosGenerados);
      await eg.save(
        eg.create({
          idOrden,
          idDetalleOrden: 0,
          fecha: hoyISO(),
          hora: horaActual(),
          estudio: 'CITOLOGIA',
          idEmpleado,
        }),
      );
      await guardarRegistro(
        manager,
        TABLA_REGISTRO.CITOLOGIA,
        idOrden,
        idEmpleado,
        'Firma',
        orden.consecutivo,
      );
    });
    return {
      idOrden,
      consecutivo: orden.consecutivo,
      estado: EstadoOrden.ATENDIDO,
      especialista: especialista.nombre,
    };
  }
}
