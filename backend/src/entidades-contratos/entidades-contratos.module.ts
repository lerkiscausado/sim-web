import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entidades } from './entities/entidades.entity';
import { EntidadesService } from './entidades.service';
import { EntidadesController } from './entidades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entidades])],
  providers: [EntidadesService],
  controllers: [EntidadesController],
  exports: [EntidadesService],
})
export class EntidadesContratosModule {}
