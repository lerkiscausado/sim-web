import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { CitasCanceladas } from './entities/citas-canceladas.entity';
import { Ingreso } from './entities/ingreso.entity';
import { Ordenes } from './entities/ordenes.entity';
import { OrdenServicio } from './entities/orden-servicio.entity';
import { DetalleOrden } from './entities/detalle-orden.entity';
import { DetalleOrdenServicio } from './entities/detalle-orden-servicio.entity';
import { Sedes } from './entities/sedes.entity';
import { Salones } from './entities/salones.entity';
import { PersonaAtiende } from './entities/persona-atiende.entity';
import { ConsentimientoInformadoPlantillas } from './entities/consentimiento-informado-plantillas.entity';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { SedesService } from './sedes.service';
import { SedesController } from './sedes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agenda,
      CitasCanceladas,
      Ingreso,
      Ordenes,
      OrdenServicio,
      DetalleOrden,
      DetalleOrdenServicio,
      Sedes,
      Salones,
      PersonaAtiende,
      ConsentimientoInformadoPlantillas,
    ]),
  ],
  providers: [AgendaService, SedesService],
  controllers: [AgendaController, SedesController],
  exports: [AgendaService, SedesService],
})
export class AdmisionesModule {}
