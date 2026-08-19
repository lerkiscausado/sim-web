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
import { AgendaService } from './agenda.service';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { CancelarCitaDto } from './dto/cancelar-cita.dto';

@Controller('admisiones/agenda')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get()
  findByDia(
    @Query('fecha') fecha: string,
    @Query('idEspecialista') idEspecialista?: string,
  ) {
    return this.agendaService.findByDia(
      fecha,
      idEspecialista ? Number(idEspecialista) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agendaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAgendaDto) {
    return this.agendaService.create(dto);
  }

  @Patch(':id/atender')
  marcarAtendida(@Param('id', ParseIntPipe) id: number) {
    return this.agendaService.marcarAtendida(id);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number, @Body() dto: CancelarCitaDto) {
    return this.agendaService.cancelar(id, dto);
  }
}
