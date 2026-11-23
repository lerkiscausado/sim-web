# Migraciones de base de datos

`synchronize` está apagado en TypeORM: los cambios de esquema se aplican a mano con estos scripts.

## Base nueva a partir de una copia de GASTROLAP (`simdb-gastrolap-rda`)

Para una base que solo va a usar sim-web (el ejecutable de escritorio ya no se conecta a ella).

| Orden | Paso | Cómo | ¿Se puede repetir? |
|---|---|---|---|
| 1 | `006_gastrolap_base_web.sql`: createdAt/updatedAt, SET→ENUM, `users.PASS` y `contratos` para bcrypt | SQLyog: abrir el archivo, `USE \`<base>\`;` en la primera línea y ejecutar todo (`Ctrl+F9`) | Sí |
| 2 | `rehash-legacy-passwords.ts`: cifra con bcrypt las contraseñas que el escritorio guardó en texto plano. Sin esto nadie puede iniciar sesión en la web | En `backend`, con `.env` apuntando a la base: `npx ts-node migrations/rehash-legacy-passwords.ts` | Sí (salta las que ya están cifradas) |

La tabla `sim_web_migraciones` registra los scripts SQL aplicados.

Las columnas de RDA y de la Resolución 3100 (`firmada`, `historia_clinica_trazabilidad`, `config_interop_api`, etc.) ya vienen en la base de GASTROLAP: las crea `GASTROLAP_instalacion_completa_bd.sql` del repositorio SIM-GLOBAL.

## Base `simdb-web` original

`001` a `005`, en orden, y luego `rehash-legacy-passwords.ts`. No son idempotentes: correr cada uno una sola vez.
