import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EspecialidadesService } from './especialidades.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('catalogos/especialidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EspecialidadesController {
  constructor(private readonly service: EspecialidadesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q, estado);
  }

  @Get('activas')
  findActivas() {
    return this.service.findActivas();
  }

  @RequirePermission('especialidades')
  @Post()
  create(@Body() dto: CreateEspecialidadDto) {
    return this.service.create(dto);
  }

  @RequirePermission('especialidades')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEspecialidadDto>) {
    return this.service.update(id, dto);
  }

  @RequirePermission('especialidades')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.service.cambiarEstado(id, estado);
  }
}
