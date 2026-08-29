-- Migración 004: createdAt/updatedAt con valor automático a nivel de MySQL,
-- como respaldo independiente de que TypeORM los envíe o no en el INSERT/UPDATE.
--
-- - createdAt: DEFAULT CURRENT_TIMESTAMP -- si la columna se omite en el
--   INSERT (o se envía la palabra DEFAULT), MySQL pone la fecha del
--   servidor automáticamente. IMPORTANTE: esto NO rescata el caso de que
--   la aplicación esté enviando explícitamente NULL -- un valor explícito
--   (aunque sea NULL) siempre gana sobre el DEFAULT de la columna.
-- - updatedAt: además de DEFAULT, se agrega ON UPDATE CURRENT_TIMESTAMP,
--   así que MySQL también la actualiza solo en cada UPDATE, sin depender
--   de que la aplicación la mande.
--
-- No borra ni modifica ningún dato existente (los registros ya guardados
-- mantienen su valor actual, sea NULL o una fecha real).

ALTER TABLE `contratos`
  MODIFY COLUMN `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  MODIFY COLUMN `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
