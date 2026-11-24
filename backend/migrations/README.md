# Migraciones de base de datos

`synchronize` está apagado en TypeORM: los cambios de esquema se aplican a mano con estos scripts.

## Base nueva a partir de una copia de GASTROLAP (`simdb-gastrolap-rda`)

Para una base que solo va a usar sim-web (el ejecutable de escritorio ya no se conecta a ella).

| Orden | Paso | Cómo | ¿Se puede repetir? |
|---|---|---|---|
| 1 | `006_gastrolap_base_web.sql`: createdAt/updatedAt, SET→ENUM, `users.PASS` y `contratos` para bcrypt | SQLyog: abrir el archivo, `USE \`<base>\`;` en la primera línea y ejecutar todo (`Ctrl+F9`) | Sí |
| 2 | `007_endoscopias_resolucion3100.sql`: firma, trazabilidad y adendas de endoscopias; marca como firmadas las que ya estaban ATENDIDO | SQLyog, igual que la 006 | Sí |
| 3 | `008_rda_envios_bundle.sql`: `rda_envios.id_detalle_orden` y `rda_envios.bundle` (documento enviado, sin el PDF) | SQLyog, igual que la 006 | Sí |
| 4 | `009_imagenes_informe_procedimiento.sql`: `imagenes.orden_informe` y `imagenes.eliminada` para las fotos de los reportes de procedimientos | SQLyog, igual que la 006 | Sí |
| 5 | `rehash-legacy-passwords.ts`: cifra con bcrypt las contraseñas que el escritorio guardó en texto plano. Sin esto nadie puede iniciar sesión en la web | En `backend`, con `.env` apuntando a la base: `npx ts-node migrations/rehash-legacy-passwords.ts` | Sí (salta las que ya están cifradas) |

La tabla `sim_web_migraciones` registra los scripts SQL aplicados.

Las columnas de RDA y de la Resolución 3100 (`firmada`, `historia_clinica_trazabilidad`, `config_interop_api`, etc.) ya vienen en la base de GASTROLAP: las crea `GASTROLAP_instalacion_completa_bd.sql` del repositorio SIM-GLOBAL.

## Base `simdb-web` original

`001` a `005`, en orden, y luego `rehash-legacy-passwords.ts`. No son idempotentes: correr cada uno una sola vez.

## Variables del .env del backend para el RDA (opcionales)

| Variable | Para qué |
|---|---|
| `RDA_CLIENT_SECRET`, `RDA_SUBSCRIPTION_KEY`, `RDA_CLIENT_ID`, `RDA_TENANT_ID` | Credenciales de MinSalud. Si están, tienen prioridad sobre `config_interop_api` y no hace falta guardarlas en la BD. |
| `RDA_PERMITIR_PRODUCCION` | Debe ser `true` para enviar a una URL que no sea el sandbox. Sin ella la web solo envía al ambiente de pruebas. |
| `RDA_SCOPE` | Scope de Azure AD. Por defecto el del sandbox (el mismo que tenía fijo el escritorio). |
| `RDA_REPS_SERVICIO_CODIGO`, `RDA_REPS_SERVICIO_TEXTO` | Servicio habilitado REPS del Encounter. Por defecto `316` / `GASTROENTEROLOGIA` (pendiente confirmar con GASTROLAP). |
