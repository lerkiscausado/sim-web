import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entidades } from './entities/entidades.entity';
import { Contratos } from './entities/contratos.entity';
import { Tarifas } from './entities/tarifas.entity';
import { Licencias } from '../seguridad/entities/licencias.entity';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entidades, Contratos, Tarifas, Licencias])],
  providers: [EntidadesService, ContratosService, TarifasService],
  controllers: [EntidadesController, ContratosController, TarifasController],
  exports: [EntidadesService, ContratosService, TarifasService],
})
export class EntidadesContratosModule {}
