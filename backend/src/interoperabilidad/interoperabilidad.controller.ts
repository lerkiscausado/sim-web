import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { RdaService } from './rda.service';
import { ActualizarConfigRdaDto } from './dto/actualizar-config-rda.dto';

/**
 * Configuración > Sistema > Interoperabilidad e Historial RDA. En el escritorio estaban en
 * el grupo Sistema (frmRDA / frmHistorialRDA); aquí se protegen con el permiso "seguridad"
 * (los administradores pasan siempre).
 */
@Controller('interoperabilidad/rda')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('seguridad')
export class InteroperabilidadController {
  constructor(private readonly rda: RdaService) {}

  @Get('config')
  config() {
    return this.rda.configPublica();
  }

  @Put('config')
  actualizarConfig(@Body() dto: ActualizarConfigRdaDto) {
    return this.rda.actualizarConfig(dto);
  }

  @Post('probar-conexion')
  probar() {
    return this.rda.probarConexion();
  }

  @Get('historial')
  historial(@Query('desde') desde?: string, @Query('hasta') hasta?: string, @Query('estado') estado?: string, @Query('q') q?: string) {
    return this.rda.historial({ desde, hasta, estado, q });
  }

  @Get('pendientes')
  pendientes() {
    return this.rda.pendientes();
  }

  @Get('envios/:id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.rda.detalleEnvio(id);
  }

  @Post('envios/:id/reenviar')
  reenviar(@Param('id', ParseIntPipe) id: number) {
    return this.rda.reenviar(id);
  }

  /** Enviar el RDA de una orden firmada que quedó sin enviar (lista de pendientes). */
  @Post('ordenes/:idOrden/enviar')
  enviarOrden(@Param('idOrden', ParseIntPipe) idOrden: number, @Query('idDetalleOrden') idDetalleOrden?: string) {
    return this.rda.enviarOrden(idOrden, null, idDetalleOrden ? Number(idDetalleOrden) : null);
  }
}
