import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoIdentificacionService } from './tipo-identificacion.service';

@Controller('catalogos/tipo-identificacion')
@UseGuards(JwtAuthGuard)
export class TipoIdentificacionController {
  constructor(private readonly service: TipoIdentificacionService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
