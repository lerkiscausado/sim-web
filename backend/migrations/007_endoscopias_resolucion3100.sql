-- =============================================================================
-- Migración 007: Resolución 3100 para los estudios de endoscopia.
--
-- El escritorio de GASTROLAP no bloquea las endoscopias firmadas (pendiente §8.1
-- punto 6 del traspaso). La web lo hace igual que con historia_clinica:
--   1. endoscopias.firmada / fecha_firma / usuario_firma (al final de la tabla).
--   2. endoscopias_trazabilidad: bitácora (CREACION, ACTUALIZACION, FIRMA,
--      INTENTO_BLOQUEADO, ADENDA).
--   3. endoscopias_adendas: correcciones sobre un estudio firmado.
--   4. Marca como firmadas las endoscopias cuyo detalle_orden ya está ATENDIDO:
--      en frmEndoscopiaGL "firmar" es lo único que pasa el detalle a ATENDIDO.
--      fecha_firma queda NULL (no se sabe cuándo se firmaron).
--
-- IDEMPOTENTE: se puede correr varias veces. No borra datos.
-- Requiere 006. Ejecutar en SQLyog con la base seleccionada (Ctrl+F9).
-- =============================================================================

SET @sw_007_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = '';

CREATE TABLE IF NOT EXISTS endoscopias_trazabilidad (
  id             INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_orden       INT          NOT NULL,
  id_endoscopia  INT          NULL,
  id_usuario     INT          NULL,
  accion         VARCHAR(30)  NOT NULL,
  detalle        VARCHAR(500) NULL,
  fecha_hora     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt      DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_endo_traz_endoscopia (id_endoscopia),
  KEY idx_endo_traz_orden (id_orden)
) COMMENT = 'Res. 3100: bitácora de los estudios de endoscopia';

CREATE TABLE IF NOT EXISTS endoscopias_adendas (
  id             INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_orden       INT       NOT NULL,
  id_endoscopia  INT       NOT NULL,
  id_usuario     INT       NULL,
  texto          TEXT      NOT NULL,
  fecha_hora     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  createdAt      DATETIME  NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt      DATETIME  NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_endo_adenda_endoscopia (id_endoscopia)
) COMMENT = 'Res. 3100: adendas de los estudios de endoscopia';

DROP PROCEDURE IF EXISTS sw_007_ejecutar;
DELIMITER $$
CREATE PROCEDURE sw_007_ejecutar()
BEGIN
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;  -- la columna ya existe

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'endoscopias' AND LOWER(COLUMN_NAME) = 'firmada') THEN
    ALTER TABLE endoscopias ADD COLUMN firmada TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'endoscopias' AND LOWER(COLUMN_NAME) = 'fecha_firma') THEN
    ALTER TABLE endoscopias ADD COLUMN fecha_firma DATETIME NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'endoscopias' AND LOWER(COLUMN_NAME) = 'usuario_firma') THEN
    ALTER TABLE endoscopias ADD COLUMN usuario_firma INT NULL;
  END IF;

  UPDATE endoscopias e
  INNER JOIN detalle_orden d ON d.ID = e.ID_DETALLE_ORDEN
  SET e.firmada = 1
  WHERE e.firmada = 0 AND d.ESTADO = 'ATENDIDO';

  INSERT IGNORE INTO sim_web_migraciones (nombre) VALUES ('007_endoscopias_resolucion3100');
END$$
DELIMITER ;

CALL sw_007_ejecutar();
DROP PROCEDURE IF EXISTS sw_007_ejecutar;

SET SESSION sql_mode = @sw_007_sql_mode;

-- Verificación: columnas_firma = 3, tablas = 2, registrada = 1.
SELECT
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'endoscopias'
      AND COLUMN_NAME IN ('firmada','fecha_firma','usuario_firma'))           AS columnas_firma,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('endoscopias_trazabilidad','endoscopias_adendas'))   AS tablas,
  (SELECT COUNT(*) FROM endoscopias WHERE firmada = 1)                        AS endoscopias_firmadas,
  (SELECT COUNT(*) FROM sim_web_migraciones
    WHERE nombre = '007_endoscopias_resolucion3100')                          AS registrada;
