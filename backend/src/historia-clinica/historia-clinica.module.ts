import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoriaClinica } from './entities/historia-clinica.entity';
import { HistoriaDiagnosticos } from './entities/historia-diagnosticos.entity';
import { HistoriaMedicamentos } from './entities/historia-medicamentos.entity';
import { HistoriaLaboratorios } from './entities/historia-laboratorios.entity';
import { HistoriaProcedimientos } from './entities/historia-procedimientos.entity';
import { HistoriaRxs } from './entities/historia-rxs.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
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
    ]),
  ],
  providers: [HistoriaClinicaService],
  controllers: [HistoriaClinicaController],
})
export class HistoriaClinicaModule {}
