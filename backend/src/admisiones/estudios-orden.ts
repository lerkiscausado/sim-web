import { DataSource } from 'typeorm';

/**
 * Estudios reales de las órdenes. En GASTROLAP la cabecera (ordenes.ID_TIPO_ESTUDIO) casi
 * siempre dice "CONSULTA PRIMERA VEZ" aunque la orden traiga endoscopia o colonoscopia: los
 * estudios están en detalle_orden (el escritorio lista por detalle, DOrdenes
 * ListadoOrdenesEndoscopia).
 *
 * Rendimiento: detalle_orden.ID_ORDEN es CHAR, así que una subconsulta correlacionada que
 * compare con ordenes.ID (INT) recorre la tabla por cada orden (5 s para 50 filas en la base
 * de GASTROLAP). Por eso los estudios se buscan en una sola consulta con los ids como texto
 * (usa el índice) y el filtro usa una subconsulta no correlacionada.
 */
export async function estudiosPorOrden(ds: DataSource, ids: number[]): Promise<Map<number, string>> {
  const mapa = new Map<number, string>();
  const unicos = [...new Set(ids.filter((n) => Number.isFinite(n)))];
  for (let i = 0; i < unicos.length; i += 1000) {
    const lote = unicos.slice(i, i + 1000).map(String);
    const filas: { idOrden: string; estudios: string }[] = await ds.query(
      `SELECT de.ID_ORDEN AS idOrden,
              GROUP_CONCAT(DISTINCT te.NOMBRE_TIPO_ESTUDIO ORDER BY te.NOMBRE_TIPO_ESTUDIO SEPARATOR ' + ') AS estudios
       FROM detalle_orden de INNER JOIN tipo_estudio te ON te.ID = de.ID_TIPO_ESTUDIO
       WHERE de.ID_ORDEN IN (${lote.map(() => '?').join(',')}) AND de.ESTADO <> 'CANCELADO'
       GROUP BY de.ID_ORDEN`,
      lote,
    );
    for (const f of filas) mapa.set(Number(f.idOrden), f.estudios);
  }
  return mapa;
}

/**
 * Filtro por tipo de estudio, con la misma regla que la columna: cuenta el tipo de las líneas
 * no canceladas de la orden; el de la cabecera solo si la orden no tiene líneas vigentes (si
 * no, casi todas las órdenes de GASTROLAP saldrían como "CONSULTA PRIMERA VEZ").
 * Subconsultas no correlacionadas: MySQL las calcula una vez.
 */
export function sqlOrdenTieneEstudio(aliasOrden: string, parametro: string) {
  const o = `\`${aliasOrden}\``;
  return `(${o}.\`ID\` IN (
            SELECT CAST(dx.ID_ORDEN AS UNSIGNED) FROM detalle_orden dx
            WHERE dx.ID_TIPO_ESTUDIO = :${parametro} AND dx.ESTADO <> 'CANCELADO')
          OR (${o}.\`ID_TIPO_ESTUDIO\` = :${parametro} AND ${o}.\`ID\` NOT IN (
            SELECT CAST(dz.ID_ORDEN AS UNSIGNED) FROM detalle_orden dz
            WHERE dz.ID_ORDEN IS NOT NULL AND dz.ESTADO <> 'CANCELADO')))`;
}
