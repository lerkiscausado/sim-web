import { Module } from '@nestjs/common';
import { InformesClinicosPdfService } from './informes-clinicos-pdf.service';

/** PDFs de historia clínica y endoscopia (GASTROLAP). Lo usan las pantallas y el RDA. */
@Module({
  providers: [InformesClinicosPdfService],
  exports: [InformesClinicosPdfService],
})
export class InformesClinicosModule {}
