import { Module } from '@nestjs/common';
import { InformesClinicosModule } from '../informes-clinicos/informes-clinicos.module';
import { RdaService } from './rda.service';
import { RdaTokenService } from './rda-token.service';
import { InteroperabilidadController } from './interoperabilidad.controller';

/** RDA (Resumen Digital de Atención) con MinSalud. */
@Module({
  imports: [InformesClinicosModule],
  providers: [RdaService, RdaTokenService],
  controllers: [InteroperabilidadController],
  exports: [RdaService],
})
export class InteroperabilidadModule {}
