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
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
  ) {
    return this.diagnosticosService.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q, estado);
  }

  /** Sin paginar, para autocompletados. */
  @Get('search')
  search(@Query('q') q: string) {
    return this.diagnosticosService.search(q);
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

  @RequirePermission('cie10')
  @Patch(':codigo/estado/:estado')
  cambiarEstado(@Param('codigo') codigo: string, @Param('estado') estado: 'A' | 'I') {
    return this.diagnosticosService.cambiarEstado(codigo, estado);
  }
}
