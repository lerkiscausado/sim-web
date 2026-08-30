import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endoscopias } from '../atenciones/entities/endoscopias.entity';
import { DetalleOrden } from '../admisiones/entities/detalle-orden.entity';
import { EndoscopiasService } from './endoscopias.service';
import { EndoscopiasController } from './endoscopias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Endoscopias, DetalleOrden])],
  providers: [EndoscopiasService],
  controllers: [EndoscopiasController],
})
export class EndoscopiasModule {}
