import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patologia } from './entities/patologia.entity';
import { Especimenes } from './entities/especimenes.entity';
import { PlantillasPatologia } from './entities/plantillas-patologia.entity';
import { EntregaResultados } from './entities/entrega-resultados.entity';
import { Ordenes } from '../admisiones/entities/ordenes.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { Empresa } from '../documentos-soporte/entities/empresa.entity';
import { PatologiaService } from './patologia.service';
import { PatologiaPdfService } from './patologia-pdf.service';
import { PatologiaController } from './patologia.controller';
import { EspecimenesService } from './especimenes.service';
import { PlantillasPatologiaService } from './plantillas-patologia.service';
import { EspecimenesController, PlantillasPatologiaController } from './especimenes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patologia,
      Especimenes,
      PlantillasPatologia,
      EntregaResultados,
      Ordenes,
      EstudiosGenerados,
      Empresa,
    ]),
  ],
  providers: [PatologiaService, PatologiaPdfService, EspecimenesService, PlantillasPatologiaService],
  controllers: [PatologiaController, EspecimenesController, PlantillasPatologiaController],
  exports: [PatologiaService],
})
export class AtencionesModule {}
