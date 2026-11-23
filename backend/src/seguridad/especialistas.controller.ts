import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { ActualizarEspecialistaRdaDto } from './dto/actualizar-especialista-rda.dto';
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

  @Get(':idEspecialista/rda')
  @UseGuards(PermissionsGuard)
  @RequirePermission('empleados')
  datosRda(@Param('idEspecialista', ParseIntPipe) idEspecialista: number) {
    return this.service.datosRda(idEspecialista);
  }

  @Put(':idEspecialista/rda')
  @UseGuards(PermissionsGuard)
  @RequirePermission('empleados')
  actualizarDatosRda(@Param('idEspecialista', ParseIntPipe) idEspecialista: number, @Body() dto: ActualizarEspecialistaRdaDto) {
    return this.service.actualizarDatosRda(idEspecialista, dto);
  }
}
