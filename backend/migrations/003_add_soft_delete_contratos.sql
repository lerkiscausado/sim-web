-- Migración 003: agrega soporte de soft delete a `contratos`.
--
-- No borra ni modifica ningún dato existente: la columna nueva queda en
-- NULL para todas las filas actuales (equivale a "no eliminado"). TypeORM
-- usa esta columna automáticamente vía @DeleteDateColumn(): al "eliminar"
-- un contrato desde la app, solo se marca esta fecha en vez de borrar la
-- fila, y las consultas normales (find/findOne y las que ya filtran
-- deletedAt IS NULL explícitamente) dejan de mostrarlo.

ALTER TABLE `contratos`
  ADD COLUMN `deletedAt` DATETIME NULL;

-- bcrypt genera hashes de 60 caracteres; el char(50) original los habría
-- truncado, dejando la contraseña encriptada inservible (nunca coincidiría
-- al verificarla). Se amplía a varchar(255), mismo patrón ya usado para
-- users.PASS en la migración 001.
ALTER TABLE `contratos`
  MODIFY COLUMN `contrasena` VARCHAR(255) NOT NULL;
