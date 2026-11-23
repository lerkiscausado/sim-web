-- =============================================================================
-- Migración 008: rda_envios guarda el detalle de la orden y el Bundle enviado.
--
-- El escritorio no guardaba el Bundle (riesgo §8.2 del traspaso: sin él no se puede
-- saber qué se mandó ni reenviar exactamente lo mismo). La web lo guarda en
-- `bundle` (sin el PDF del DocumentReference, para no inflar la tabla) y anota el
-- detalle_orden reportado en `id_detalle_orden` para reenviar el mismo servicio.
--
-- IDEMPOTENTE. No borra datos. Requiere 006.
-- =============================================================================

DROP PROCEDURE IF EXISTS sw_008_ejecutar;
DELIMITER $$
CREATE PROCEDURE sw_008_ejecutar()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;  -- la columna ya existe

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rda_envios' AND LOWER(COLUMN_NAME) = 'id_detalle_orden') THEN
    ALTER TABLE rda_envios ADD COLUMN id_detalle_orden INT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rda_envios' AND LOWER(COLUMN_NAME) = 'bundle') THEN
    ALTER TABLE rda_envios ADD COLUMN bundle MEDIUMTEXT NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rda_envios' AND INDEX_NAME = 'idx_rda_envios_orden') THEN
    CREATE INDEX idx_rda_envios_orden ON rda_envios (id_orden, tipo_documento);
  END IF;

  INSERT IGNORE INTO sim_web_migraciones (nombre) VALUES ('008_rda_envios_bundle');
END$$
DELIMITER ;

CALL sw_008_ejecutar();
DROP PROCEDURE IF EXISTS sw_008_ejecutar;

-- Verificación: columnas = 2, registrada = 1.
SELECT
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rda_envios'
      AND COLUMN_NAME IN ('id_detalle_orden','bundle'))                        AS columnas,
  (SELECT COUNT(*) FROM sim_web_migraciones WHERE nombre = '008_rda_envios_bundle') AS registrada;
