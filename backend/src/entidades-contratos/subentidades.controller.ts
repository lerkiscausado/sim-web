import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubentidadesService } from './subentidades.service';

@Controller('entidades-contratos/subentidades')
@UseGuards(JwtAuthGuard)
export class SubentidadesController {
  constructor(private readonly service: SubentidadesService) {}

  @Get()
  findByContrato(@Query('idContrato') idContrato: string) {
    return this.service.findByContrato(Number(idContrato));
  }
}
