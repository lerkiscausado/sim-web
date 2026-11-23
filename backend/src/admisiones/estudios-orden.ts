/**
 * Estudios reales de una orden. En GASTROLAP la cabecera (ordenes.ID_TIPO_ESTUDIO) casi
 * siempre dice "CONSULTA PRIMERA VEZ" aunque la orden traiga endoscopia o colonoscopia: los
 * estudios están en detalle_orden (el escritorio lista por detalle, DOrdenes
 * ListadoOrdenesEndoscopia). Se muestran todos los tipos de las líneas no canceladas; si la
 * orden no tiene líneas, el de la cabecera.
 */
export function sqlEstudiosOrden(aliasOrden: string, aliasTipoCabecera: string) {
  return `COALESCE((SELECT GROUP_CONCAT(DISTINCT te.NOMBRE_TIPO_ESTUDIO ORDER BY te.NOMBRE_TIPO_ESTUDIO SEPARATOR ' + ')
            FROM detalle_orden de INNER JOIN tipo_estudio te ON te.ID = de.ID_TIPO_ESTUDIO
            WHERE CAST(de.ID_ORDEN AS UNSIGNED) = \`${aliasOrden}\`.\`ID\` AND de.ESTADO <> 'CANCELADO'),
          \`${aliasTipoCabecera}\`.\`NOMBRE_TIPO_ESTUDIO\`)`;
}

/** Filtro por tipo de estudio: el de la cabecera o el de cualquier línea de la orden. */
export function sqlOrdenTieneEstudio(aliasOrden: string, parametro: string) {
  return `(\`${aliasOrden}\`.\`ID_TIPO_ESTUDIO\` = :${parametro} OR EXISTS (
            SELECT 1 FROM detalle_orden dx WHERE CAST(dx.ID_ORDEN AS UNSIGNED) = \`${aliasOrden}\`.\`ID\`
              AND dx.ID_TIPO_ESTUDIO = :${parametro} AND dx.ESTADO <> 'CANCELADO'))`;
}
