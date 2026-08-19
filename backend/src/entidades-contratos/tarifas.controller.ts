import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TarifasService } from './tarifas.service';

@Controller('entidades-contratos/tarifas')
@UseGuards(JwtAuthGuard)
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  findAll() {
    return this.tarifasService.findAll();
  }
}
