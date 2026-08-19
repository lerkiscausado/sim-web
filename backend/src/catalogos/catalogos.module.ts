import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';
import { Cups } from './entities/cups.entity';
import { Medicamentos } from './entities/medicamentos.entity';
import { DiagnosticosService } from './diagnosticos.service';
import { DiagnosticosController } from './diagnosticos.controller';
import { CupsService } from './cups.service';
import { CupsController } from './cups.controller';
import { MedicamentosService } from './medicamentos.service';
import { MedicamentosController } from './medicamentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnosticos, Cups, Medicamentos])],
  providers: [DiagnosticosService, CupsService, MedicamentosService],
  controllers: [DiagnosticosController, CupsController, MedicamentosController],
  exports: [DiagnosticosService, CupsService, MedicamentosService],
})
export class CatalogosModule {}
