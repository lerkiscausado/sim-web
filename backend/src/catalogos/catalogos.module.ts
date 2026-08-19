import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';
import { Cups } from './entities/cups.entity';
import { Medicamentos } from './entities/medicamentos.entity';
import { TipoEstudio } from './entities/tipo-estudio.entity';
import { TipoIdentificacion } from './entities/tipo-identificacion.entity';
import { DiagnosticosService } from './diagnosticos.service';
import { DiagnosticosController } from './diagnosticos.controller';
import { CupsService } from './cups.service';
import { CupsController } from './cups.controller';
import { MedicamentosService } from './medicamentos.service';
import { MedicamentosController } from './medicamentos.controller';
import { TipoEstudioService } from './tipo-estudio.service';
import { TipoEstudioController } from './tipo-estudio.controller';
import { TipoIdentificacionService } from './tipo-identificacion.service';
import { TipoIdentificacionController } from './tipo-identificacion.controller';
import { LookupsService } from './lookups.service';
import { LookupsController } from './lookups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnosticos, Cups, Medicamentos, TipoEstudio, TipoIdentificacion])],
  providers: [
    DiagnosticosService,
    CupsService,
    MedicamentosService,
    TipoEstudioService,
    TipoIdentificacionService,
    LookupsService,
  ],
  controllers: [
    DiagnosticosController,
    CupsController,
    MedicamentosController,
    TipoEstudioController,
    TipoIdentificacionController,
    LookupsController,
  ],
  exports: [DiagnosticosService, CupsService, MedicamentosService, TipoEstudioService, TipoIdentificacionService],
})
export class CatalogosModule {}
