/**
 * Después de correr migrations/001_add_timestamps_and_pass.sql, la columna
 * `users.PASS` ya tiene espacio para un hash bcrypt (VARCHAR(255)), pero las
 * contraseñas existentes siguen en su formato legado (texto plano, máx 20
 * caracteres) porque la migración de esquema no toca los datos.
 *
 * Este script re-hashea con bcrypt cualquier PASS que NO tenga ya formato
 * bcrypt (no empieza con $2a$/$2b$/$2y$). Es seguro correrlo varias veces:
 * si ya está hasheado, lo deja intacto.
 *
 * Uso:  npx ts-node migrations/rehash-legacy-passwords.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const BCRYPT_PREFIX = /^\$2[aby]\$/;

async function main() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  await dataSource.initialize();

  const rows: { ID: number; PASS: string }[] = await dataSource.query(
    'SELECT ID, PASS FROM users',
  );

  let updated = 0;
  for (const row of rows) {
    if (!row.PASS || BCRYPT_PREFIX.test(row.PASS)) {
      continue; // ya está hasheado o vacío
    }
    const hash = await bcrypt.hash(row.PASS.trim(), 10);
    await dataSource.query('UPDATE users SET PASS = ? WHERE ID = ?', [
      hash,
      row.ID,
    ]);
    updated++;
  }

  console.log(`Usuarios re-hasheados: ${updated} de ${rows.length}`);
  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
