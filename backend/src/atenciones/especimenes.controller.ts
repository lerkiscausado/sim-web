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
import { EspecimenesService } from './especimenes.service';
import { CreateEspecimenDto } from './dto/create-especimen.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';
import { PlantillasPatologiaService } from './plantillas-patologia.service';
import { CreatePlantillaPatologiaDto } from './dto/create-plantilla-patologia.dto';

@Controller('atenciones/especimenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EspecimenesController {
  constructor(private readonly especimenesService: EspecimenesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.especimenesService.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q);
  }

  @Get('activos')
  findActivos() {
    return this.especimenesService.findActivos();
  }

  @RequirePermission('patologia')
  @Post()
  create(@Body() dto: CreateEspecimenDto) {
    return this.especimenesService.create(dto);
  }

  @RequirePermission('patologia')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateEspecimenDto>) {
    return this.especimenesService.update(id, dto);
  }

  @RequirePermission('patologia')
  @Patch(':id/estado/:estado')
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Param('estado') estado: EstadoActivoInactivo) {
    return this.especimenesService.cambiarEstado(id, estado);
  }
}

@Controller('atenciones/plantillas-patologia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('patologia')
export class PlantillasPatologiaController {
  constructor(private readonly plantillasService: PlantillasPatologiaService) {}

  @Get()
  findAll() {
    return this.plantillasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plantillasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlantillaPatologiaDto) {
    return this.plantillasService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePlantillaPatologiaDto>) {
    return this.plantillasService.update(id, dto);
  }

  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.plantillasService.desactivar(id);
  }
}
