import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { HistoriaDiagnosticos } from './entities/historia-diagnosticos.entity';
import { HistoriaMedicamentos } from './entities/historia-medicamentos.entity';
import { HistoriaLaboratorios } from './entities/historia-laboratorios.entity';
import { HistoriaProcedimientos } from './entities/historia-procedimientos.entity';
import { HistoriaRxs } from './entities/historia-rxs.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { Antecedentes } from '../pacientes/entities/antecedentes.entity';
import { HistoriaClinicaTrazabilidad } from './entities/historia-clinica-trazabilidad.entity';
import { HistoriaClinicaAdenda } from './entities/historia-clinica-adenda.entity';
import { HistoriaClinicaService } from './historia-clinica.service';
import { HistoriaClinicaController } from './historia-clinica.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HistoriaClinica,
      HistoriaDiagnosticos,
      HistoriaMedicamentos,
      HistoriaLaboratorios,
      HistoriaProcedimientos,
      HistoriaRxs,
      DetalleOrden,
      Antecedentes,
      HistoriaClinicaTrazabilidad,
      HistoriaClinicaAdenda,
    ]),
  ],
  providers: [HistoriaClinicaService],
  controllers: [HistoriaClinicaController],
})
export class HistoriaClinicaModule {}
