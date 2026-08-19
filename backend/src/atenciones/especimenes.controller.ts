import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EspecimenesService } from './especimenes.service';
import { PlantillasPatologiaService } from './plantillas-patologia.service';
import { CreatePlantillaPatologiaDto } from './dto/create-plantilla-patologia.dto';

@Controller('atenciones/especimenes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('patologia')
export class EspecimenesController {
  constructor(private readonly especimenesService: EspecimenesService) {}

  @Get()
  findAll() {
    return this.especimenesService.findAll();
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
