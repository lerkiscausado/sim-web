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
import { MedicamentosService } from './medicamentos.service';
import { CreateMedicamentoDto } from './dto/create-medicamento.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('catalogos/medicamentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicamentosController {
  constructor(private readonly medicamentosService: MedicamentosService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
  ) {
    return this.medicamentosService.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q, estado);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.medicamentosService.findOne(id);
  }

  @RequirePermission('medicamentos')
  @Post()
  create(@Body() dto: CreateMedicamentoDto) {
    return this.medicamentosService.create(dto);
  }

  @RequirePermission('medicamentos')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateMedicamentoDto>) {
    return this.medicamentosService.update(id, dto);
  }

  @RequirePermission('medicamentos')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.medicamentosService.cambiarEstado(id, estado);
  }
}
