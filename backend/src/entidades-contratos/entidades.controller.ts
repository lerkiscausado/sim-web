import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EntidadesService } from './entidades.service';
import { CreateEntidadDto } from './dto/create-entidad.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('entidades-contratos/entidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.entidadesService.findAll(q);
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string) {
    return this.entidadesService.findOne(codigo);
  }

  @RequirePermission('entidades')
  @Post()
  create(@Body() dto: CreateEntidadDto) {
    return this.entidadesService.create(dto);
  }

  @RequirePermission('entidades')
  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: Partial<CreateEntidadDto>) {
    return this.entidadesService.update(codigo, dto);
  }

  @RequirePermission('entidades')
  @Patch(':codigo/estado/:estado')
  cambiarEstado(@Param('codigo') codigo: string, @Param('estado') estado: EstadoActivoInactivo) {
    return this.entidadesService.cambiarEstado(codigo, estado);
  }
}
