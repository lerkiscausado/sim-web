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
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('entidades-contratos/contratos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.contratosService.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q);
  }

  /** Sin paginar, para selects (formulario de Órdenes). */
  @Get('activos')
  findActivos() {
    return this.contratosService.findActivos();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.findOne(id);
  }

  @RequirePermission('contratos')
  @Post()
  create(@Body() dto: CreateContratoDto) {
    return this.contratosService.create(dto);
  }

  @RequirePermission('contratos')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateContratoDto>) {
    return this.contratosService.update(id, dto);
  }

  @RequirePermission('contratos')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.contratosService.cambiarEstado(id, estado);
  }

  /** Soft delete: no borra la fila, solo marca deletedAt. */
  @RequirePermission('contratos')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contratosService.remove(id);
  }
}
