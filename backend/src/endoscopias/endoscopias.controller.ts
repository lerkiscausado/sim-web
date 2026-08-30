import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EndoscopiasService } from './endoscopias.service';
import { UpsertEndoscopiaDto } from './dto/upsert-endoscopia.dto';

@Controller('atenciones/endoscopias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('endoscopia')
export class EndoscopiasController {
  constructor(private readonly service: EndoscopiasService) {}

  @Get('pendientes')
  findPendientes(@Req() req: any, @Query('q') q?: string) {
    return this.service.findPendientes(req.user.idEmpleado, q);
  }

  @Get('detalle-orden/:idDetalleOrden')
  findByDetalleOrden(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.findByDetalleOrden(idDetalleOrden);
  }

  @Get('paciente/:idUsuario/estudios-anteriores')
  estudiosAnteriores(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.service.estudiosAnteriores(idUsuario);
  }

  @Post()
  upsert(@Body() dto: UpsertEndoscopiaDto, @Req() req: any) {
    return this.service.upsert(dto, req.user.idEmpleado);
  }

  @Patch('detalle-orden/:idDetalleOrden/firmar')
  firmar(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.firmar(idDetalleOrden);
  }
}
