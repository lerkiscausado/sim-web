-- =============================================================================
-- Migración 006: prepara una base de GASTROLAP (copia de simdb-gastrolap-rda)
-- para que la use sim-web.
--
-- Hace, de forma IDEMPOTENTE (se puede correr varias veces), lo mismo que las
-- migraciones 001-005, que se escribieron para simdb-web y no se pueden correr
-- tal cual sobre otra base (no son idempotentes y asumen una lista fija de
-- tablas):
--   1. Tabla `sim_web_migraciones`: registro de los scripts aplicados.
--   2. createdAt / updatedAt en TODAS las tablas que no los tengan
--      (equivale a 001 + 004 + 005). Las filas que ya existen quedan con NULL,
--      igual que en 001; las nuevas reciben la fecha del servidor.
--   3. Columnas SET -> ENUM (equivale a 002), conservando nulabilidad y default.
--   4. users.PASS a VARCHAR(255) para bcrypt (parte de 001).
--   5. contratos.deletedAt y contratos.contrasena VARCHAR(255) (equivale a 003).
--
-- No borra ni modifica datos. Esta base ya NO tiene que ser compatible con el
-- ejecutable de escritorio (decisión del 2026-11-23): agregar columnas a
-- `endoscopias` rompe su INSERT posicional, y eso es aceptado.
--
-- Cómo correrlo: en MySQL Workbench / DBeaver, con la base seleccionada
-- (USE `simdb-gastrolap-rda-web`;), ejecutar el archivo completo.
-- Recomendado: backup previo.
-- =============================================================================

-- La base heredada del escritorio tiene defaults que el modo estricto de
-- MySQL 8 rechaza al reconstruir una tabla (fechas 0000-00-00, SET con
-- default vacío). Se desactiva el modo estricto SOLO en esta sesión y se
-- restaura al final del script.
SET @sw_006_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = '';

CREATE TABLE IF NOT EXISTS sim_web_migraciones (
  nombre      VARCHAR(100) NOT NULL PRIMARY KEY,
  aplicada_en DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) COMMENT = 'Scripts de backend/migrations aplicados en esta base';

DROP PROCEDURE IF EXISTS sw_006_ejecutar;
DELIMITER $$
CREATE PROCEDURE sw_006_ejecutar()
BEGIN
  DECLARE v_id  INT DEFAULT 0;
  DECLARE v_max INT DEFAULT 0;
  -- Si la columna ya existe (p. ej. con otras mayúsculas que INFORMATION_SCHEMA
  -- no empareja), MySQL da 1060 "Duplicate column name": el estado deseado ya
  -- se cumple, así que se sigue con la siguiente sentencia.
  DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;

  DROP TEMPORARY TABLE IF EXISTS sw_006_sentencias;
  CREATE TEMPORARY TABLE sw_006_sentencias (
    id  INT AUTO_INCREMENT PRIMARY KEY,
    sql_text TEXT NOT NULL
  );

  -- 2a. Agregar createdAt donde falte (NULL para filas existentes).
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT CONCAT('ALTER TABLE `', t.TABLE_NAME, '` ADD COLUMN `createdAt` DATETIME NULL')
  FROM INFORMATION_SCHEMA.TABLES t
  WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
    AND t.TABLE_NAME <> 'sim_web_migraciones'
    AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c
                    WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
                      AND LOWER(c.COLUMN_NAME) = LOWER('createdAt'));

  -- 2b. Agregar updatedAt donde falte.
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT CONCAT('ALTER TABLE `', t.TABLE_NAME, '` ADD COLUMN `updatedAt` DATETIME NULL')
  FROM INFORMATION_SCHEMA.TABLES t
  WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
    AND t.TABLE_NAME <> 'sim_web_migraciones'
    AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c
                    WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
                      AND LOWER(c.COLUMN_NAME) = LOWER('updatedAt'));

  -- Ejecuta 2a/2b antes de calcular los defaults (las columnas deben existir).
  SELECT COALESCE(MAX(id), 0) INTO v_max FROM sw_006_sentencias;
  WHILE v_id < v_max DO
    SET v_id = v_id + 1;
    SELECT sql_text INTO @sw_sql FROM sw_006_sentencias WHERE id = v_id;
    PREPARE st FROM @sw_sql; EXECUTE st; DEALLOCATE PREPARE st;
  END WHILE;
  TRUNCATE TABLE sw_006_sentencias;
  SET v_id = 0;

  -- 2c. Defaults automáticos (004/005). MODIFY no toca los NULL ya guardados.
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT CONCAT('ALTER TABLE `', c.TABLE_NAME, '` MODIFY COLUMN `createdAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP')
  FROM INFORMATION_SCHEMA.COLUMNS c
  JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
  WHERE c.TABLE_SCHEMA = DATABASE() AND c.COLUMN_NAME = 'createdAt'
    AND c.TABLE_NAME <> 'sim_web_migraciones'
    AND c.DATA_TYPE = 'datetime'
    AND (c.COLUMN_DEFAULT IS NULL OR c.COLUMN_DEFAULT = 'NULL');

  INSERT INTO sw_006_sentencias (sql_text)
  SELECT CONCAT('ALTER TABLE `', c.TABLE_NAME, '` MODIFY COLUMN `updatedAt` DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  FROM INFORMATION_SCHEMA.COLUMNS c
  JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
  WHERE c.TABLE_SCHEMA = DATABASE() AND c.COLUMN_NAME = 'updatedAt'
    AND c.TABLE_NAME <> 'sim_web_migraciones'
    AND c.DATA_TYPE = 'datetime'
    AND LOWER(c.EXTRA) NOT LIKE '%on update%';

  -- 3. SET -> ENUM conservando la lista de valores, la nulabilidad y el default.
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT CONCAT('ALTER TABLE `', c.TABLE_NAME, '` MODIFY COLUMN `', c.COLUMN_NAME, '` ',
                -- Si el default es vacío y '' no está en la lista, se agrega '' como
                -- primer valor: un SET acepta '' (conjunto vacío) y un ENUM no.
                IF(c.COLUMN_DEFAULT IS NOT NULL AND c.COLUMN_DEFAULT <> 'NULL'
                     AND TRIM(BOTH '''' FROM c.COLUMN_DEFAULT) = ''
                     AND c.COLUMN_TYPE NOT LIKE 'set('''',%'
                     AND c.COLUMN_TYPE NOT LIKE '%,'''')'
                     AND c.COLUMN_TYPE NOT LIKE '%,'''',%',
                   CONCAT('enum('''',', SUBSTRING(c.COLUMN_TYPE, 5)),
                   CONCAT('enum', SUBSTRING(c.COLUMN_TYPE, 4))),
                IF(c.IS_NULLABLE = 'NO', ' NOT NULL', ' NULL'),
                IF(c.COLUMN_DEFAULT IS NULL OR c.COLUMN_DEFAULT = 'NULL', '',
                   CONCAT(' DEFAULT ', QUOTE(TRIM(BOTH '''' FROM c.COLUMN_DEFAULT)))))
  FROM INFORMATION_SCHEMA.COLUMNS c
  JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
  WHERE c.TABLE_SCHEMA = DATABASE() AND c.DATA_TYPE = 'set';

  -- 4. users.PASS para hashes bcrypt.
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT 'ALTER TABLE `users` MODIFY COLUMN `PASS` VARCHAR(255) NOT NULL'
  FROM INFORMATION_SCHEMA.COLUMNS c
  WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'users' AND c.COLUMN_NAME = 'PASS'
    AND NOT (c.DATA_TYPE = 'varchar' AND c.CHARACTER_MAXIMUM_LENGTH >= 255);

  -- 5. contratos: soft delete y contraseña para bcrypt.
  INSERT INTO sw_006_sentencias (sql_text)
  SELECT 'ALTER TABLE `contratos` ADD COLUMN `deletedAt` DATETIME NULL'
  FROM INFORMATION_SCHEMA.TABLES t
  WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_NAME = 'contratos'
    AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c
                    WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'contratos' AND LOWER(c.COLUMN_NAME) = LOWER('deletedAt'));

  INSERT INTO sw_006_sentencias (sql_text)
  SELECT 'ALTER TABLE `contratos` MODIFY COLUMN `contrasena` VARCHAR(255) NOT NULL'
  FROM INFORMATION_SCHEMA.COLUMNS c
  WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'contratos' AND c.COLUMN_NAME = 'contrasena'
    AND NOT (c.DATA_TYPE = 'varchar' AND c.CHARACTER_MAXIMUM_LENGTH >= 255);

  SELECT COALESCE(MAX(id), 0) INTO v_max FROM sw_006_sentencias;
  WHILE v_id < v_max DO
    SET v_id = v_id + 1;
    SELECT sql_text INTO @sw_sql FROM sw_006_sentencias WHERE id = v_id;
    PREPARE st FROM @sw_sql; EXECUTE st; DEALLOCATE PREPARE st;
  END WHILE;

  DROP TEMPORARY TABLE IF EXISTS sw_006_sentencias;

  -- Solo se registra si el procedimiento llegó hasta aquí sin errores.
  INSERT IGNORE INTO sim_web_migraciones (nombre) VALUES ('006_gastrolap_base_web');
END$$
DELIMITER ;

CALL sw_006_ejecutar();
DROP PROCEDURE IF EXISTS sw_006_ejecutar;

SET SESSION sql_mode = @sw_006_sql_mode;

-- -----------------------------------------------------------------------------
-- Verificación: las tres cifras deben dar 0 y `registrada` debe dar 1.
-- -----------------------------------------------------------------------------
SELECT
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES t
    WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
      AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS c
                      WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
                        AND LOWER(c.COLUMN_NAME) = 'createdat')
      AND t.TABLE_NAME <> 'sim_web_migraciones')                       AS tablas_sin_createdAt,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
    JOIN INFORMATION_SCHEMA.TABLES t ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME AND t.TABLE_TYPE = 'BASE TABLE'
    WHERE c.TABLE_SCHEMA = DATABASE() AND c.DATA_TYPE = 'set')        AS columnas_set_restantes,
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA = DATABASE() AND c.TABLE_NAME = 'users' AND c.COLUMN_NAME = 'PASS'
      AND c.CHARACTER_MAXIMUM_LENGTH < 255)                           AS pass_sin_ampliar,
  (SELECT COUNT(*) FROM sim_web_migraciones
    WHERE nombre = '006_gastrolap_base_web')                          AS registrada;
