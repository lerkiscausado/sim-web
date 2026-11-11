import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Informes } from '../documentos-soporte/entities/informes.entity';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { aISOLocal } from '../common/registros.util';

const MAX_FILAS = 5000;

/**
 * frmInformes: informes guardados como consultas SQL en la tabla `informes`
 * (los crea el ADMINISTRADOR). En la web la consulta se ejecuta en una
 * transacción de solo lectura y solo se aceptan SELECT/WITH de una sentencia.
 */
@Injectable()
export class InformesService {
  constructor(
    @InjectRepository(Informes)
    private readonly informesRepository: Repository<Informes>,
    private readonly dataSource: DataSource,
  ) {}

  listar(incluirInactivos: boolean) {
    return this.informesRepository.find({
      where: incluirInactivos ? {} : { estado: EstadoActivoInactivo.ACTIVO },
      order: { nombre: 'ASC' },
    });
  }

  private validarSql(sql: string): string {
    const limpio = (sql ?? '').trim().replace(/;\s*$/, '');
    if (!limpio) throw new BadRequestException('La consulta está vacía');
    const sinComentarios = limpio
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(--|#)[^\n]*/g, ' ');
    if (!/^\s*(select|with)\b/i.test(sinComentarios))
      throw new BadRequestException('Solo se permiten consultas SELECT');
    if (sinComentarios.includes(';'))
      throw new BadRequestException(
        'Solo se permite una sentencia por informe',
      );
    if (
      /\b(into\s+outfile|into\s+dumpfile|load_file|sleep\s*\(|benchmark\s*\(|for\s+update|lock\s+in\s+share)\b/i.test(
        sinComentarios,
      )
    ) {
      throw new BadRequestException(
        'La consulta contiene instrucciones no permitidas',
      );
    }
    return limpio;
  }

  async guardar(datos: {
    id?: number;
    nombre: string;
    query: string;
    estado?: EstadoActivoInactivo;
  }) {
    if (!datos.nombre?.trim())
      throw new BadRequestException('El nombre es obligatorio');
    const query = this.validarSql(datos.query);
    if (datos.id) {
      const existente = await this.informesRepository.findOne({
        where: { id: datos.id },
      });
      if (!existente) throw new NotFoundException('Informe no encontrado');
      Object.assign(existente, {
        nombre: datos.nombre.trim(),
        query,
        estado: datos.estado ?? existente.estado,
      });
      return this.informesRepository.save(existente);
    }
    return this.informesRepository.save(
      this.informesRepository.create({
        nombre: datos.nombre.trim(),
        query,
        estado: datos.estado ?? EstadoActivoInactivo.ACTIVO,
      }),
    );
  }

  async ejecutar(id: number) {
    const informe = await this.informesRepository.findOne({ where: { id } });
    if (!informe) throw new NotFoundException('Informe no encontrado');
    const sql = this.validarSql(informe.query);
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('SET SESSION TRANSACTION READ ONLY');
      await runner.query('START TRANSACTION READ ONLY');
      const filas: Record<string, unknown>[] = await runner.query(
        `SELECT * FROM (${sql}) AS informe LIMIT ${MAX_FILAS + 1}`,
      );
      await runner.query('ROLLBACK');
      const columnas = filas.length ? Object.keys(filas[0]) : [];
      const normal = filas.slice(0, MAX_FILAS).map((f) => {
        const o: Record<string, unknown> = {};
        for (const k of columnas) {
          const v = f[k];
          o[k] =
            v instanceof Date
              ? aISOLocal(v)
              : Buffer.isBuffer(v)
                ? '[binario]'
                : v;
        }
        return o;
      });
      return {
        informe: { id: informe.id, nombre: informe.nombre },
        columnas,
        filas: normal,
        truncado: filas.length > MAX_FILAS,
      };
    } catch (e) {
      await runner.query('ROLLBACK').catch(() => undefined);
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(
        `Error al ejecutar el informe: ${e instanceof Error ? e.message : e}`,
      );
    } finally {
      await runner
        .query('SET SESSION TRANSACTION READ WRITE')
        .catch(() => undefined);
      await runner.release();
    }
  }
}
