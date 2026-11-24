-- =============================================================================
-- Migración 009: fotos de los reportes de procedimientos (endoscopia, colonoscopia,
-- rectoscopia, estudios especiales).
--
-- Se mantiene la convención del escritorio (frmImagenesVideo / frmImagenesCapturadas):
--   imagenes.ESTADO = 'I'  capturada, no va en el informe
--   imagenes.ESTADO = 'A'  seleccionada para el informe (máximo 9)
-- y se agregan:
--   orden_informe  posición de la foto en el informe (1..9); NULL si no va.
--   eliminada      1 = la quitaron de la galería (borrado lógico; el escritorio no
--                  tenía eliminar y la web usaba ESTADO='I', que choca con lo anterior).
--
-- IDEMPOTENTE. No borra datos. Requiere 006.
-- =============================================================================

DROP PROCEDURE IF EXISTS sw_009_ejecutar;
DELIMITER $$
CREATE PROCEDURE sw_009_ejecutar()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;  -- la columna ya existe

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imagenes' AND LOWER(COLUMN_NAME) = 'orden_informe') THEN
    ALTER TABLE imagenes ADD COLUMN orden_informe TINYINT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imagenes' AND LOWER(COLUMN_NAME) = 'eliminada') THEN
    ALTER TABLE imagenes ADD COLUMN eliminada TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imagenes' AND INDEX_NAME = 'idx_imagenes_detalle') THEN
    CREATE INDEX idx_imagenes_detalle ON imagenes (ID_DETALLE_ORDEN, eliminada);
  END IF;

  INSERT IGNORE INTO sim_web_migraciones (nombre) VALUES ('009_imagenes_informe_procedimiento');
END$$
DELIMITER ;

CALL sw_009_ejecutar();
DROP PROCEDURE IF EXISTS sw_009_ejecutar;

-- Verificación: columnas = 2, registrada = 1.
SELECT
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'imagenes'
      AND COLUMN_NAME IN ('orden_informe','eliminada'))                                     AS columnas,
  (SELECT COUNT(*) FROM sim_web_migraciones WHERE nombre = '009_imagenes_informe_procedimiento') AS registrada;
