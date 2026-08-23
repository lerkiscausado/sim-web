import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entidades } from './entities/entidades.entity';
import { Contratos } from './entities/contratos.entity';
import { Tarifas } from './entities/tarifas.entity';
import { Subentidades } from './entities/subentidades.entity';
import { DetalleTarifa } from './entities/detalle-tarifa.entity';
import { Licencias } from '../seguridad/entities/licencias.entity';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';
import { ContratosService } from './contratos.service';
import { ContratosController } from './contratos.controller';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';
import { SubentidadesService } from './subentidades.service';
import { SubentidadesController } from './subentidades.controller';
import { DetalleTarifaService } from './detalle-tarifa.service';
import { DetalleTarifaController } from './detalle-tarifa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entidades, Contratos, Tarifas, Subentidades, DetalleTarifa, Licencias])],
  providers: [EntidadesService, ContratosService, TarifasService, SubentidadesService, DetalleTarifaService],
  controllers: [
    EntidadesController,
    ContratosController,
    TarifasController,
    SubentidadesController,
    DetalleTarifaController,
  ],
  exports: [EntidadesService, ContratosService, TarifasService, SubentidadesService],
})
export class EntidadesContratosModule {}
