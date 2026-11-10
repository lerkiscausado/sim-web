import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtencionesModule } from '../atenciones/atenciones.module';
import { Ordenes } from '../admisiones/entities/ordenes.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { EntregaResultados } from '../atenciones/entities/entrega-resultados.entity';
import { Patologia } from '../atenciones/entities/patologia.entity';
import { Citologia } from '../atenciones/entities/citologia.entity';
import { DatosAdjuntos } from '../documentos-soporte/entities/datos-adjuntos.entity';
import { Imagenes } from '../documentos-soporte/entities/imagenes.entity';
import { Informes } from '../documentos-soporte/entities/informes.entity';
import { EstudiosGenerados } from '../documentos-soporte/entities/estudios-generados.entity';
import { ConsultaOrdenesService } from './consulta-ordenes.service';
import { ArchivosOrdenService } from './archivos-orden.service';
import { CorreoService } from './correo.service';
import { InformesService } from './informes.service';
import { ConsultaOrdenesController } from './consulta-ordenes.controller';
import { InicioController, InicioService } from './inicio';

@Module({
  imports: [
    AtencionesModule,
    TypeOrmModule.forFeature([
      Ordenes,
      DetalleOrden,
      EntregaResultados,
      Patologia,
      Citologia,
      DatosAdjuntos,
      Imagenes,
      Informes,
      EstudiosGenerados,
    ]),
  ],
  providers: [
    ConsultaOrdenesService,
    ArchivosOrdenService,
    CorreoService,
    InformesService,
    InicioService,
  ],
  controllers: [ConsultaOrdenesController, InicioController],
})
export class ConsultaOrdenesModule {}
