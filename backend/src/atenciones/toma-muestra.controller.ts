import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { TomaMuestraService } from './toma-muestra.service';
import { UpsertTomaMuestraDto } from './dto/upsert-toma-muestra.dto';

@Controller('atenciones/toma-muestra')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('citologia')
export class TomaMuestraController {
  constructor(private readonly service: TomaMuestraService) {}

  @Get('paciente/:idUsuario')
  findByUsuario(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.service.findByUsuario(idUsuario);
  }

  @Post()
  upsert(@Body() dto: UpsertTomaMuestraDto) {
    return this.service.upsert(dto);
  }
}
