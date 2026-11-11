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
import { EmpleadosService } from './empleados.service';
import { CreateEmpleadoDto } from './dto/create-empleado.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('seguridad/empleados')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmpleadosController {
  constructor(private readonly service: EmpleadosService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
    @Query('idCargo') idCargo?: string,
  ) {
    return this.service.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q, {
      estado,
      idCargo: idCargo ? Number(idCargo) : undefined,
    });
  }

  @Get('activos')
  findActivos() {
    return this.service.findActivos();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @RequirePermission('empleados')
  @Post()
  create(@Body() dto: CreateEmpleadoDto) {
    return this.service.create(dto);
  }

  @RequirePermission('empleados')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEmpleadoDto>) {
    return this.service.update(id, dto);
  }

  @RequirePermission('empleados')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.service.cambiarEstado(id, estado);
  }
}
