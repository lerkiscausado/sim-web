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
import { CitologiaPdfService } from './citologia-pdf.service';
import { enviarPdf } from './patologia.controller';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CitologiaService } from './citologia.service';
import { UpsertCitologiaDto } from './dto/upsert-citologia.dto';

@Controller('atenciones/citologia')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('citologia')
export class CitologiaController {
  constructor(
    private readonly citologiaService: CitologiaService,
    private readonly citologiaPdfService: CitologiaPdfService,
  ) {}

  @Get('pendientes')
  findPendientes(@Query('q') q?: string) {
    return this.citologiaService.findPendientes(q);
  }

  @Get('orden/:idOrden')
  findByOrden(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.citologiaService.findByOrden(idOrden);
  }

  @Get('paciente/:idUsuario/estudios-anteriores')
  estudiosAnteriores(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.citologiaService.estudiosAnteriores(idUsuario);
  }

  @Post()
  upsert(@Body() dto: UpsertCitologiaDto, @Req() req: any) {
    return this.citologiaService.upsert(dto, req.user.idEmpleado);
  }

  /** Firma el estudio (chkFirmarEstudio del VB.NET): la orden pasa a ATENDIDO. */
  @Post('orden/:idOrden/firmar')
  firmar(@Param('idOrden', ParseIntPipe) idOrden: number, @Req() req: any) {
    return this.citologiaService.firmar(idOrden, req.user.idEmpleado);
  }

  @Get('orden/:idOrden/pdf')
  async pdf(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Res() res: Response,
    @Query('descargar') descargar?: string,
  ) {
    const { buffer, nombreArchivo } =
      await this.citologiaPdfService.generar(idOrden);
    enviarPdf(res, buffer, nombreArchivo, descargar === '1');
  }
}
