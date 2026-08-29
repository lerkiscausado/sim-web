import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SeguridadModule } from './seguridad/seguridad.module';
import { AdmisionesModule } from './admisiones/admisiones.module';
import { AtencionesModule } from './atenciones/atenciones.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { EntidadesContratosModule } from './entidades-contratos/entidades-contratos.module';
import { PacientesModule } from './pacientes/pacientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // IMPORTANTE: synchronize queda en false porque la BD es una base
        // legada en producción con datos reales y 119 tablas MyISAM sin FKs.
        // Los cambios de esquema (createdAt/updatedAt en todas las tablas,
        // PASS a varchar(255) para bcrypt) se aplican con la migración SQL
        // en migrations/001_add_timestamps_and_pass.sql, revisada a mano.
        synchronize: false,
        autoLoadEntities: true,
        // DIAGNÓSTICO TEMPORAL: activa el log de cada SQL ejecutado, para
        // encontrar por qué createdAt queda en NULL al crear un contrato.
        // Quitar (volver a false) una vez resuelto.
        logging: ['query', 'error'],
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    SeguridadModule,
    AdmisionesModule,
    AtencionesModule,
    CatalogosModule,
    EntidadesContratosModule,
    PacientesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
