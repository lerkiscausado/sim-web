import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmpleadosService } from './empleados.service';

@Controller('seguridad/empleados')
@UseGuards(JwtAuthGuard)
export class EmpleadosController {
  constructor(private readonly service: EmpleadosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
