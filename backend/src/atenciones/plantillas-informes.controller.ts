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
import { PlantillasInformesService } from './plantillas-informes.service';
import { CreatePlantillaInformeDto } from './dto/create-plantilla-informe.dto';

@Controller('atenciones/plantillas-informes')
@UseGuards(JwtAuthGuard)
export class PlantillasInformesController {
  constructor(private readonly service: PlantillasInformesService) {}

  @Get()
  findAll(@Query('idTipoEstudio') idTipoEstudio?: string, @Query('idEspecialista') idEspecialista?: string) {
    return this.service.findAll(
      idTipoEstudio ? Number(idTipoEstudio) : undefined,
      idEspecialista ? Number(idEspecialista) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlantillaInformeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePlantillaInformeDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.service.desactivar(id);
  }
}
