import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
  ) {
    return this.pacientesService.findAll(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
      q,
    );
  }

  @Get(':id/foto')
  async getFoto(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const foto = await this.pacientesService.getFoto(id);
    if (!foto) {
      throw new NotFoundException('Este paciente no tiene foto cargada');
    }
    res.set({ 'Content-Type': foto.contentType, 'Cache-Control': 'private, max-age=300' });
    res.send(foto.buffer);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pacientesService.findOne(id);
  }

  @RequirePermission('usuarios')
  @Post()
  create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  @RequirePermission('usuarios')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreatePacienteDto>) {
    return this.pacientesService.update(id, dto);
  }
}
