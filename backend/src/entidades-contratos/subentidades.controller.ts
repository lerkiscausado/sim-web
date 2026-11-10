import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubentidadesService } from './subentidades.service';

@Controller('entidades-contratos/subentidades')
@UseGuards(JwtAuthGuard)
export class SubentidadesController {
  constructor(private readonly service: SubentidadesService) {}

  @Get()
  findByContrato(@Query('idContrato') idContrato: string) {
    if (!idContrato || !/^\d+$/.test(idContrato)) {
      throw new BadRequestException(
        'El parámetro idContrato es obligatorio y debe ser numérico',
      );
    }
    return this.service.findByContrato(Number(idContrato));
  }
}
