import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Diagnosticos } from './entities/diagnosticos.entity';
import { DiagnosticosService } from './diagnosticos.service';
import { DiagnosticosController } from './diagnosticos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Diagnosticos])],
  providers: [DiagnosticosService],
  controllers: [DiagnosticosController],
  exports: [DiagnosticosService],
})
export class CatalogosModule {}
