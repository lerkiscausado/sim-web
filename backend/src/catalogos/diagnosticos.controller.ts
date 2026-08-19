import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { DiagnosticosService } from './diagnosticos.service';
import { CreateDiagnosticoDto } from './dto/create-diagnostico.dto';

@Controller('catalogos/diagnosticos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DiagnosticosController {
  constructor(private readonly diagnosticosService: DiagnosticosService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.diagnosticosService.findAll(q);
  }

  @Get(':codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.diagnosticosService.findByCodigo(codigo);
  }

  @RequirePermission('cie10')
  @Post()
  create(@Body() dto: CreateDiagnosticoDto) {
    return this.diagnosticosService.create(dto);
  }

  @RequirePermission('cie10')
  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: Partial<CreateDiagnosticoDto>) {
    return this.diagnosticosService.update(codigo, dto);
  }
}
