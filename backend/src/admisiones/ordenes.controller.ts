import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { OrdenesService } from './ordenes.service';
import { CreateOrdenDto } from './dto/create-orden.dto';
import { CreateDetalleOrdenDto } from './dto/create-detalle-orden.dto';

@Controller('admisiones/ordenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('listadoOrdenes')
export class OrdenesController {
  constructor(private readonly ordenesService: OrdenesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.ordenesService.findAll(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      q,
    );
  }

  @Get('paciente/:idUsuario')
  findByPaciente(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.ordenesService.findByPaciente(idUsuario);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesService.findOne(id);
  }

  @Get(':id/detalles')
  findDetalles(@Param('id', ParseIntPipe) id: number) {
    return this.ordenesService.findDetalles(id);
  }

  @Post()
  create(@Body() dto: CreateOrdenDto, @Req() req: any) {
    return this.ordenesService.create(dto, req.user.idEmpleado);
  }

  @Post(':id/detalles')
  addDetalle(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateDetalleOrdenDto) {
    return this.ordenesService.addDetalle(id, dto);
  }

  @Patch('detalles/:idDetalle/cancelar')
  cancelarDetalle(@Param('idDetalle', ParseIntPipe) idDetalle: number) {
    return this.ordenesService.cancelarDetalle(idDetalle);
  }
}
