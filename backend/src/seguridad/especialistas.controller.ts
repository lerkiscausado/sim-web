import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EspecialistasService } from './especialistas.service';

@Controller('seguridad/especialistas')
@UseGuards(JwtAuthGuard)
export class EspecialistasController {
  constructor(private readonly service: EspecialistasService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
