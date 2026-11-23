import { Module } from '@nestjs/common';
import { InformesClinicosModule } from '../informes-clinicos/informes-clinicos.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endoscopias } from '../atenciones/entities/endoscopias.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { EndoscopiasService } from './endoscopias.service';
import { EndoscopiaTrazabilidad } from './entities/endoscopia-trazabilidad.entity';
import { EndoscopiaAdenda } from './entities/endoscopia-adenda.entity';
import { EndoscopiasController } from './endoscopias.controller';

@Module({
  imports: [
    InformesClinicosModule,TypeOrmModule.forFeature([Endoscopias, DetalleOrden, EndoscopiaTrazabilidad, EndoscopiaAdenda])],
  providers: [EndoscopiasService],
  controllers: [EndoscopiasController],
})
export class EndoscopiasModule {}
