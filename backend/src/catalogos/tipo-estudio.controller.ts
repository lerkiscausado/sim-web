import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipoEstudioService } from './tipo-estudio.service';

@Controller('catalogos/tipo-estudio')
@UseGuards(JwtAuthGuard)
export class TipoEstudioController {
  constructor(private readonly service: TipoEstudioService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
