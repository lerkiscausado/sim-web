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
import { CargosService } from './cargos.service';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { EstadoActivoInactivoEliminado } from '../common/enums/estado.enum';

@Controller('catalogos/cargos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CargosController {
  constructor(private readonly service: CargosService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q);
  }

  @Get('activos')
  findActivos() {
    return this.service.findActivos();
  }

  @RequirePermission('cargos')
  @Post()
  create(@Body() dto: CreateCargoDto) {
    return this.service.create(dto);
  }

  @RequirePermission('cargos')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateCargoDto>) {
    return this.service.update(id, dto);
  }

  @RequirePermission('cargos')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivoEliminado) {
    return this.service.cambiarEstado(id, estado);
  }
}
