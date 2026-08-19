import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiagnosticosService } from './diagnosticos.service';

@Controller('catalogos/diagnosticos')
@UseGuards(JwtAuthGuard)
export class DiagnosticosController {
  constructor(private readonly diagnosticosService: DiagnosticosService) {}

  @Get()
  search(@Query('q') q: string) {
    return this.diagnosticosService.search(q);
  }

  @Get(':codigo')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.diagnosticosService.findByCodigo(codigo);
  }
}
