import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Endoscopias } from '../atenciones/entities/endoscopias.entity';
import { DetalleOrden, EstadoDetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { UpsertEndoscopiaDto } from './dto/upsert-endoscopia.dto';

/**
 * Tipos de estudio que alimentan la cola de Endoscopias, réplica exacta de
 * DOrdenes.PacientesEstudioEndoscopia() (IDs 10, 11 y 12 en tipo_estudio,
 * hardcodeados igual que el VB.NET original -- misma base de datos que se
 * está migrando).
 */
const TIPOS_ESTUDIO_ENDOSCOPIA = [10, 11, 12];

@Injectable()
export class EndoscopiasService {
  constructor(
    @InjectRepository(Endoscopias)
    private readonly repo: Repository<Endoscopias>,
    @InjectRepository(DetalleOrden)
    private readonly detalleOrdenRepo: Repository<DetalleOrden>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Cola de trabajo del especialista: réplica de PacientesEstudioEndoscopia
   * (IdEspecialista) -- tipo_estudio.ID IN (10,11,12), detalle_orden.ESTADO
   * ='PENDIENTE', ordenes.ID_EMPLEADO = el especialista logueado. Se agrega
   * el nombre del CUPS y del tipo de estudio (usados en el frontend para
   * precargar la plantilla del reporte según el tipo de procedimiento,
   * igual que hace frmEndoscopia.vb).
   */
  async findPendientes(idEmpleado: number, q?: string) {
    const qb = this.detalleOrdenRepo
      .createQueryBuilder('d')
      .innerJoin('ordenes', 'o', 'o.ID = CAST(d.ID_ORDEN AS UNSIGNED)')
      .innerJoin('usuarios', 'p', 'p.ID = o.ID_USUARIO')
      .innerJoin('tipo_estudio', 't', 't.ID = d.ID_TIPO_ESTUDIO')
      .innerJoin('cups', 'c', 'c.CODIGO_CUPS = d.CODIGO_CUPS')
      .select([
        'd.ID AS idDetalleOrden',
        'o.ID AS idOrden',
        'o.CONSECUTIVO AS consecutivo',
        'o.NUMERO_ORDEN AS numeroOrden',
        'o.FECHA_INGRESO AS fechaIngreso',
        'o.ID_USUARIO AS idUsuario',
        't.NOMBRE_TIPO_ESTUDIO AS estudio',
        'c.NOMBRE_CUPS AS nombreCups',
        'p.ID_TIPO_IDENTIFICACION AS idTipoIdentificacion',
        'p.IDENTIFICACION AS identificacion',
        'p.PRIMER_NOMBRE AS primerNombre',
        'p.SEGUNDO_NOMBRE AS segundoNombre',
        'p.PRIMER_APELLIDO AS primerApellido',
        'p.SEGUNDO_APELLIDO AS segundoApellido',
        'p.SEXO AS sexo',
        'p.FECHA_NACIMIENTO AS fechaNacimiento',
        'p.TELEFONO AS telefono',
        'p.CORREO_ELECTRONICO AS correoElectronico',
        'p.ID AS pacienteId',
      ])
      .where('t.ID IN (:...tipos)', { tipos: TIPOS_ESTUDIO_ENDOSCOPIA })
      .andWhere('d.ESTADO = :estado', { estado: EstadoDetalleOrden.PENDIENTE })
      .andWhere('o.ID_EMPLEADO = :idEmpleado', { idEmpleado });

    if (q && q.trim().length > 0) {
      const term = `%${q.trim()}%`;
      qb.andWhere(
        '(o.NUMERO_ORDEN LIKE :term OR o.CONSECUTIVO LIKE :term OR p.IDENTIFICACION LIKE :term ' +
          'OR p.PRIMER_NOMBRE LIKE :term OR p.PRIMER_APELLIDO LIKE :term)',
        { term },
      );
    }

    const filas = await qb.orderBy('o.FECHA_INGRESO', 'ASC').getRawMany();

    return filas.map((f) => ({
      idDetalleOrden: f.idDetalleOrden,
      idOrden: f.idOrden,
      consecutivo: f.consecutivo,
      numeroOrden: f.numeroOrden,
      fechaIngreso: f.fechaIngreso,
      idUsuario: f.idUsuario,
      estudio: f.estudio,
      nombreCups: f.nombreCups,
      paciente: {
        id: f.pacienteId,
        idTipoIdentificacion: f.idTipoIdentificacion,
        identificacion: f.identificacion,
        primerNombre: f.primerNombre,
        segundoNombre: f.segundoNombre,
        primerApellido: f.primerApellido,
        segundoApellido: f.segundoApellido,
        sexo: f.sexo,
        fechaNacimiento: f.fechaNacimiento,
        telefono: f.telefono,
        correoElectronico: f.correoElectronico,
      },
    }));
  }

  findByDetalleOrden(idDetalleOrden: number) {
    return this.repo.findOne({ where: { idDetalleOrden } });
  }

  /** Historial de endoscopias anteriores del paciente (ya atendidas), del más reciente al más antiguo. */
  async estudiosAnteriores(idUsuario: number) {
    return this.dataSource.query(
      `SELECT e.ID AS id, e.ID_ORDEN AS idOrden, o.CONSECUTIVO AS consecutivo,
              o.NUMERO_ORDEN AS numeroOrden, o.FECHA_INGRESO AS fechaIngreso,
              t.NOMBRE_TIPO_ESTUDIO AS estudio, e.CAMPO1 AS campo1, e.DIAGNOSTICO AS diagnostico
       FROM endoscopias e
       INNER JOIN ordenes o ON o.ID = e.ID_ORDEN
       LEFT JOIN detalle_orden d ON d.ID = e.ID_DETALLE_ORDEN
       LEFT JOIN tipo_estudio t ON t.ID = d.ID_TIPO_ESTUDIO
       WHERE o.ID_USUARIO = ?
       ORDER BY o.FECHA_INGRESO DESC`,
      [idUsuario],
    );
  }

  async upsert(dto: UpsertEndoscopiaDto, idEmpleado: number): Promise<Endoscopias> {
    const { idOrden, idDetalleOrden, ...campos } = dto;
    let endoscopia = await this.repo.findOne({ where: { idDetalleOrden } });

    if (endoscopia) {
      Object.assign(endoscopia, campos, { idEmpleado });
    } else {
      endoscopia = this.repo.create({
        idOrden,
        idDetalleOrden,
        hora: new Date().toTimeString().slice(0, 8),
        idEmpleado,
        // Igual que en el VB.NET original: campo2/campo3 no se usan desde
        // este formulario, se guardan vacíos.
        campo2: '',
        campo3: '',
        ...campos,
      } as Partial<Endoscopias>);
    }
    return this.repo.save(endoscopia);
  }

  /** Firma el reporte y marca la línea de orden como ATENDIDO. */
  async firmar(idDetalleOrden: number) {
    const endoscopia = await this.repo.findOne({ where: { idDetalleOrden } });
    if (!endoscopia) throw new NotFoundException('No hay reporte de endoscopia registrado para esta línea de orden');
    await this.detalleOrdenRepo.update({ id: idDetalleOrden }, { estado: EstadoDetalleOrden.ATENDIDO });
    return endoscopia;
  }
}
