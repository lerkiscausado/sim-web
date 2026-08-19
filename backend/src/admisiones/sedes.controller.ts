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
import { SedesService } from './sedes.service';
import { CreateSedeDto } from './dto/create-sede.dto';

@Controller('admisiones/sedes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get()
  findAll() {
    return this.sedesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.findOne(id);
  }

  @RequirePermission('usuarios')
  @Post()
  create(@Body() dto: CreateSedeDto) {
    return this.sedesService.create(dto);
  }

  @RequirePermission('usuarios')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateSedeDto>) {
    return this.sedesService.update(id, dto);
  }

  @RequirePermission('usuarios')
  @Delete(':id')
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.sedesService.desactivar(id);
  }
}
