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
import { TarifasService } from './tarifas.service';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('entidades-contratos/tarifas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    // Compatibilidad: sin 'page' en la query devuelve el arreglo plano
    // (usado por el select del formulario de Contratos); con 'page' devuelve paginado.
    if (page === undefined) {
      return this.tarifasService.findAll();
    }
    return this.tarifasService.findAllPaginado(Number(page), pageSize ? Number(pageSize) : 20, q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tarifasService.findOne(id);
  }

  @RequirePermission('tarifas')
  @Post()
  create(@Body() dto: CreateTarifaDto) {
    return this.tarifasService.create(dto);
  }

  @RequirePermission('tarifas')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateTarifaDto>) {
    return this.tarifasService.update(id, dto);
  }

  @RequirePermission('tarifas')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.tarifasService.cambiarEstado(id, estado);
  }
}
