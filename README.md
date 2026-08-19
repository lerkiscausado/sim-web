# SIM Web

Migración web del sistema SIM (originalmente VB.NET WinForms) a una
arquitectura moderna:

- **backend/**: API en NestJS + TypeORM + MySQL, contra la base de datos
  `simdb-web` real (sin modificar columnas existentes, solo agregando
  `createdAt`/`updatedAt` vía migración explícita).
- **frontend/**: Next.js + shadcn/ui.

## Estado actual

- ✅ Fase 0: 119 entities de TypeORM generadas fielmente desde el esquema
  real (`simdb.sql`), organizadas en 10 módulos temáticos dentro de
  `backend/src/`, con `createdAt`/`updatedAt` y enums de estado.
- ✅ Auth reescrito contra la tabla `users` real (login por `usuario`/`pass`,
  bcrypt, permisos granulares en vez de roles fijos).
- ⏳ Fase 1 en curso: implementación funcional módulo por módulo
  (Admisiones primero), backend + frontend conectados.

## Antes de correr contra datos reales

```bash
# 1. Copiar variables de entorno
cp backend/.env.example backend/.env
# completar con las credenciales reales (NO se commitean)

# 2. Aplicar la migración de esquema (createdAt/updatedAt + PASS -> varchar(255))
mysql -h <host> -u <user> -p simdb-web < backend/migrations/001_add_timestamps_and_pass.sql

# 3. (Recomendado) Migrar contraseñas legadas de texto plano a bcrypt
cd backend && npx ts-node migrations/rehash-legacy-passwords.ts

# 4. Instalar dependencias y levantar
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```
