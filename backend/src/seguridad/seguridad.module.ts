import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { EspecialistasService } from './especialistas.service';
import { EspecialistasController } from './especialistas.controller';
import { Users } from './entities/users.entity';
import { Empleados } from './entities/empleados.entity';
import { Especialistas } from './entities/especialistas.entity';
import { Privilegios } from './entities/privilegios.entity';
import { Botones } from './entities/botones.entity';
import { Menu } from './entities/menu.entity';
import { Submenu } from './entities/submenu.entity';
import { Sesiones } from './entities/sesiones.entity';
import { Auditoria } from './entities/auditoria.entity';
import { BloqueoRegistros } from './entities/bloqueo-registros.entity';
import { Licencias } from './entities/licencias.entity';
import { Tablas } from './entities/tablas.entity';
import { Registros } from './entities/registros.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      Empleados,
      Especialistas,
      Privilegios,
      Botones,
      Menu,
      Submenu,
      Sesiones,
      Auditoria,
      BloqueoRegistros,
      Licencias,
      Tablas,
      Registros,
    ]),
  ],
  providers: [UsersService, EspecialistasService],
  controllers: [UsersController, EspecialistasController],
  exports: [UsersService],
})
export class SeguridadModule {}
