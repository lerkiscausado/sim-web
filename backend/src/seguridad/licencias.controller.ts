import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicenciasService } from './licencias.service';

@Controller('seguridad/licencias')
@UseGuards(JwtAuthGuard)
export class LicenciasController {
  constructor(private readonly service: LicenciasService) {}

  /** Solo los datos que se muestran en 'Acerca de' (cliente, serial, id de origen). */
  @Get('activa')
  async findActiva() {
    const licencia = await this.service.findActiva();
    if (!licencia) return null;
    return {
      cliente: licencia.cliente,
      serial: licencia.serial,
      idOrigen: licencia.idOrigen,
    };
  }
}
