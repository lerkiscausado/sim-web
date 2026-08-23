import {
  Body,
  Controller,
  Delete,
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
import { DetalleTarifaService } from './detalle-tarifa.service';
import { CreateDetalleTarifaDto } from './dto/create-detalle-tarifa.dto';

@Controller('entidades-contratos/tarifas/:idTarifa/detalle')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DetalleTarifaController {
  constructor(private readonly service: DetalleTarifaService) {}

  @Get()
  findAll(
    @Param('idTarifa', ParseIntPipe) idTarifa: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.service.findAllPaginado(idTarifa, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q);
  }

  @RequirePermission('tarifas')
  @Post()
  create(@Param('idTarifa', ParseIntPipe) idTarifa: number, @Body() dto: CreateDetalleTarifaDto) {
    return this.service.create(idTarifa, dto);
  }

  @RequirePermission('tarifas')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateDetalleTarifaDto>) {
    return this.service.update(id, dto);
  }

  @RequirePermission('tarifas')
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminar(id);
  }
}
