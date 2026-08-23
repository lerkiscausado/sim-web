import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { PatologiaService } from './patologia.service';
import { PatologiaPdfService } from './patologia-pdf.service';
import { UpsertPatologiaDto } from './dto/upsert-patologia.dto';

@Controller('atenciones/patologia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('patologia')
export class PatologiaController {
  constructor(
    private readonly patologiaService: PatologiaService,
    private readonly patologiaPdfService: PatologiaPdfService,
  ) {}

  @Get('pendientes')
  findPendientes(@Query('idSede') idSede?: string, @Query('q') q?: string) {
    return this.patologiaService.findPendientes(idSede ? Number(idSede) : undefined, q);
  }

  @Get('orden/:idOrden')
  findByOrden(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.patologiaService.findByOrden(idOrden);
  }

  @Get('paciente/:idUsuario')
  findByPaciente(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.patologiaService.findByPaciente(idUsuario);
  }

  @Get('paciente/:idUsuario/estudios-anteriores')
  estudiosAnteriores(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.patologiaService.estudiosAnteriores(idUsuario);
  }

  @Post()
  upsert(@Body() dto: UpsertPatologiaDto, @Req() req: any) {
    return this.patologiaService.upsert(dto, req.user.idEmpleado);
  }

  @Get('orden/:idOrden/pdf')
  async descargarPdf(@Param('idOrden', ParseIntPipe) idOrden: number, @Res() res: Response) {
    const buffer = await this.patologiaPdfService.generar(idOrden);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="informe-patologia-${idOrden}.pdf"`,
    });
    res.send(buffer);
  }
}
