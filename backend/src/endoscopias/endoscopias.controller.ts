import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { InformesClinicosPdfService, enviarPdf } from '../informes-clinicos/informes-clinicos-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EndoscopiasService } from './endoscopias.service';
import { UpsertEndoscopiaDto } from './dto/upsert-endoscopia.dto';
import { AddAdendaDto } from '../historia-clinica/dto/add-adenda.dto';

@Controller('atenciones/endoscopias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('endoscopia')
export class EndoscopiasController {
  constructor(
    private readonly service: EndoscopiasService,
    private readonly pdf: InformesClinicosPdfService,
  ) {}

  /** Informe en PDF (borrador con marca de agua si aún no está firmado). */
  @Get('detalle-orden/:idDetalleOrden/pdf')
  async pdfInforme(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Res() res: Response,
    @Query('descargar') descargar?: string,
  ) {
    const { buffer, nombreArchivo } = await this.pdf.endoscopia(idDetalleOrden);
    enviarPdf(res, buffer, nombreArchivo, descargar === '1');
  }

  @Get('pendientes')
  findPendientes(@Req() req: any, @Query('q') q?: string) {
    return this.service.findPendientes(req.user.idEmpleado, q);
  }

  @Get('firmadas')
  findFirmadas(@Req() req: any, @Query('q') q?: string) {
    return this.service.findFirmadas(req.user.idEmpleado, q);
  }

  /** Plantilla del especialista en sesión para el tipo de estudio. */
  @Get('plantilla/:idTipoEstudio')
  plantilla(@Param('idTipoEstudio', ParseIntPipe) idTipoEstudio: number, @Req() req: any) {
    return this.service.plantilla(req.user.idEmpleado, idTipoEstudio);
  }

  @Get('detalle-orden/:idDetalleOrden/faltantes')
  faltantes(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.faltantesParaFirmar(idDetalleOrden);
  }

  @Get('detalle-orden/:idDetalleOrden/adendas')
  listAdendas(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listAdendas(idDetalleOrden);
  }

  @Post('detalle-orden/:idDetalleOrden/adendas')
  addAdenda(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number, @Body() dto: AddAdendaDto, @Req() req: any) {
    return this.service.addAdenda(idDetalleOrden, dto.texto, req.user.idEmpleado);
  }

  @Get('detalle-orden/:idDetalleOrden')
  findByDetalleOrden(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.findByDetalleOrden(idDetalleOrden);
  }

  @Get('paciente/:idUsuario/estudios-anteriores')
  estudiosAnteriores(@Param('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.service.estudiosAnteriores(idUsuario);
  }

  @Post()
  upsert(@Body() dto: UpsertEndoscopiaDto, @Req() req: any) {
    return this.service.upsert(dto, req.user.idEmpleado);
  }

  @Patch('detalle-orden/:idDetalleOrden/firmar')
  firmar(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number, @Req() req: any) {
    return this.service.firmar(idDetalleOrden, req.user.idEmpleado);
  }
}
