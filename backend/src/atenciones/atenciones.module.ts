import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patologia } from './entities/patologia.entity';
import { Especimenes } from './entities/especimenes.entity';
import { PlantillasPatologia } from './entities/plantillas-patologia.entity';
import { PlantillasInformes } from './entities/plantillas-informes.entity';
import { EntregaResultados } from './entities/entrega-resultados.entity';
import { Citologia } from './entities/citologia.entity';
import { TomaMuestra } from './entities/toma-muestra.entity';
import { Ordenes } from '../admisiones/entities/ordenes.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { Empresa } from '../documentos-soporte/entities/empresa.entity';
import { PatologiaService } from './patologia.service';
import { PatologiaPdfService } from './patologia-pdf.service';
import { PatologiaController } from './patologia.controller';
import { EspecimenesService } from './especimenes.service';
import { PlantillasPatologiaService } from './plantillas-patologia.service';
import { PlantillasInformesService } from './plantillas-informes.service';
import { PlantillasInformesController } from './plantillas-informes.controller';
import { EspecimenesController, PlantillasPatologiaController } from './especimenes.controller';
import { CitologiaService } from './citologia.service';
import { CitologiaController } from './citologia.controller';
import { TomaMuestraService } from './toma-muestra.service';
import { TomaMuestraController } from './toma-muestra.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patologia,
      Especimenes,
      PlantillasPatologia,
      PlantillasInformes,
      EntregaResultados,
      Citologia,
      TomaMuestra,
      Ordenes,
      EstudiosGenerados,
      Empresa,
    ]),
  ],
  providers: [
    PatologiaService,
    PatologiaPdfService,
    EspecimenesService,
    PlantillasPatologiaService,
    PlantillasInformesService,
    CitologiaService,
    TomaMuestraService,
  ],
  controllers: [
    PatologiaController,
    EspecimenesController,
    PlantillasPatologiaController,
    PlantillasInformesController,
    CitologiaController,
    TomaMuestraController,
  ],
  exports: [PatologiaService],
})
export class AtencionesModule {}
