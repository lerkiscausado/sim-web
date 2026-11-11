import { Controller, Get, Injectable, Req, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { aISOLocal, hoyISO } from '../common/registros.util';

/** Resumen real para la página de Inicio (antes mostraba cifras de ejemplo). */
@Injectable()
export class InicioService {
  constructor(private readonly dataSource: DataSource) {}

  async resumen(idEmpleado: number) {
    const hoy = hoyISO();
    const mes = hoy.slice(0, 7);
    const q = async (sql: string, params: unknown[] = []) =>
      Number((await this.dataSource.query(sql, params))[0]?.n ?? 0);

    const [
      patologiasPendientes,
      patologiasConInforme,
      citologiasPendientes,
      ordenesHoy,
      ordenesMes,
      firmadosMes,
      entregasHoy,
    ] = await Promise.all([
      q(
        `SELECT COUNT(*) n FROM ordenes o JOIN tipo_estudio t ON t.ID = o.ID_TIPO_ESTUDIO
           WHERE o.ESTADO NOT IN ('ATENDIDO','CANCELADO','FACTURADO') AND t.PREFIJO NOT IN ('CV','CB')`,
      ),
      q(
        `SELECT COUNT(*) n FROM ordenes o JOIN tipo_estudio t ON t.ID = o.ID_TIPO_ESTUDIO JOIN patologia p ON p.ID_ORDEN = o.ID
           WHERE o.ESTADO NOT IN ('ATENDIDO','CANCELADO','FACTURADO') AND t.PREFIJO NOT IN ('CV','CB')`,
      ),
      q(
        `SELECT COUNT(DISTINCT o.ID) n FROM ordenes o JOIN tipo_estudio t ON t.ID = o.ID_TIPO_ESTUDIO JOIN detalle_orden d ON d.ID_ORDEN = o.ID
           WHERE t.PREFIJO IN ('CV','CB','CR') AND o.ESTADO NOT IN ('ATENDIDO','CANCELADO','FACTURADO') AND d.CODIGO_CUPS IN ('898001','898002')`,
      ),
      q(
        `SELECT COUNT(*) n FROM ordenes WHERE FECHA_INGRESO = ? AND ESTADO <> 'CANCELADO'`,
        [hoy],
      ),
      q(
        `SELECT COUNT(*) n FROM ordenes WHERE DATE_FORMAT(FECHA_INGRESO,'%Y-%m') = ? AND ESTADO <> 'CANCELADO'`,
        [mes],
      ),
      q(
        `SELECT COUNT(DISTINCT ID_ORDEN) n FROM estudios_generados WHERE DATE_FORMAT(FECHA,'%Y-%m') = ?`,
        [mes],
      ),
      q(
        `SELECT COUNT(*) n FROM entrega_resultados er JOIN ordenes o ON o.ID = er.ID_ORDEN
           WHERE er.FECHA_ENTREGA = ? AND o.ESTADO <> 'CANCELADO'`,
        [hoy],
      ),
    ]);

    const actividad = await this.dataSource.query(
      `SELECT eg.ID id, eg.FECHA fecha, eg.HORA hora, eg.ESTUDIO estudio, o.ID idOrden, o.CONSECUTIVO consecutivo,
              TRIM(CONCAT_WS(' ', u.PRIMER_NOMBRE, u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO)) paciente, e.NOMBRE_EMPLEADO empleado
       FROM estudios_generados eg
       JOIN ordenes o ON o.ID = eg.ID_ORDEN
       LEFT JOIN usuarios u ON u.ID = o.ID_USUARIO
       LEFT JOIN empleados e ON e.ID = eg.ID_EMPLEADO
       ORDER BY eg.FECHA DESC, eg.HORA DESC, eg.ID DESC
       LIMIT 8`,
    );
    const empleado = await this.dataSource.query(
      'SELECT NOMBRE_EMPLEADO nombre FROM empleados WHERE ID = ?',
      [idEmpleado],
    );

    return {
      empleado: empleado[0]?.nombre ?? null,
      patologiasPendientes,
      patologiasConInforme,
      citologiasPendientes,
      ordenesHoy,
      ordenesMes,
      firmadosMes,
      entregasHoy,
      actividad: actividad.map((a: Record<string, unknown>) => ({
        ...a,
        fecha:
          a.fecha instanceof Date
            ? aISOLocal(a.fecha)
            : String(a.fecha ?? '').slice(0, 10),
      })),
    };
  }
}

@Controller('inicio')
@UseGuards(JwtAuthGuard)
export class InicioController {
  constructor(private readonly inicio: InicioService) {}

  @Get('resumen')
  resumen(@Req() req: any) {
    return this.inicio.resumen(req.user.idEmpleado);
  }
}
