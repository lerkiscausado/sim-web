import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { SubentidadesService } from './subentidades.service';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

@Controller('entidades-contratos/subentidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SubentidadesController {
  constructor(private readonly service: SubentidadesService) {}

  /** Activas de un contrato (combo de la orden). `todas=1` incluye las inactivas (administración). */
  @Get()
  findByContrato(@Query('idContrato') idContrato: string, @Query('todas') todas?: string) {
    if (!idContrato || !/^\d+$/.test(idContrato)) {
      throw new BadRequestException('El parámetro idContrato es obligatorio y debe ser numérico');
    }
    return todas === '1' ? this.service.findTodasDeContrato(Number(idContrato)) : this.service.findByContrato(Number(idContrato));
  }

  @Post()
  @RequirePermission('subEntidades')
  create(@Body() body: { idContrato: number; nombre: string }) {
    if (!Number.isInteger(Number(body?.idContrato))) throw new BadRequestException('idContrato es obligatorio');
    return this.service.create(Number(body.idContrato), body.nombre);
  }

  @Patch(':id')
  @RequirePermission('subEntidades')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { nombre: string }) {
    return this.service.update(id, body?.nombre);
  }

  @Patch(':id/estado/:estado')
  @RequirePermission('subEntidades')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: string) {
    if (!['A', 'I', 'E'].includes(estado)) throw new BadRequestException('Estado inválido (A, I o E)');
    return this.service.cambiarEstado(id, estado as EstadoActivoInactivoEliminado);
  }
}
