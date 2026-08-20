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
import { Especialidades } from './entities/especialidades.entity';
import { EspecialidadesService } from './especialidades.service';
import { EspecialidadesController } from './especialidades.controller';
import { Cargos } from './entities/cargos.entity';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Diagnosticos,
      Cups,
      Medicamentos,
      TipoEstudio,
      TipoIdentificacion,
      Especialidades,
      Cargos,
    ]),
  ],
  providers: [
    DiagnosticosService,
    CupsService,
    MedicamentosService,
    TipoEstudioService,
    TipoIdentificacionService,
    LookupsService,
    EspecialidadesService,
    CargosService,
  ],
  controllers: [
    DiagnosticosController,
    CupsController,
    MedicamentosController,
    TipoEstudioController,
    TipoIdentificacionController,
    LookupsController,
    EspecialidadesController,
    CargosController,
  ],
  exports: [
    DiagnosticosService,
    CupsService,
    MedicamentosService,
    TipoEstudioService,
    TipoIdentificacionService,
    EspecialidadesService,
    CargosService,
  ],
})
export class CatalogosModule {}
