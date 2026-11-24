import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { InformesClinicosPdfService, enviarPdf } from '../informes-clinicos/informes-clinicos-pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { EndoscopiasService } from './endoscopias.service';
import { UpsertEndoscopiaDto } from './dto/upsert-endoscopia.dto';
import { AddAdendaDto } from '../historia-clinica/dto/add-adenda.dto';
import { ImagenesProcedimientoService } from './imagenes-procedimiento.service';
import type { ArchivoSubido } from '../consulta-ordenes/archivos-orden.service';
import { ActualizarImagenDto, OrdenarImagenesDto } from './dto/imagenes-procedimiento.dto';

@Controller('atenciones/endoscopias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('endoscopia')
export class EndoscopiasController {
  constructor(
    private readonly service: EndoscopiasService,
    private readonly pdf: InformesClinicosPdfService,
    private readonly imagenes: ImagenesProcedimientoService,
  ) {}

  // ───────── Fotos del procedimiento (solo reportes de procedimientos) ─────────

  @Get('detalle-orden/:idDetalleOrden/imagenes')
  listarImagenes(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.imagenes.listar(idDetalleOrden);
  }

  /** Una foto tomada del video del endoscopio (campo multipart "imagen"). */
  @Post('detalle-orden/:idDetalleOrden/imagenes')
  @UseInterceptors(FileInterceptor('imagen', { limits: { fileSize: 9 * 1024 * 1024 } }))
  capturarImagen(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @UploadedFile() archivo?: ArchivoSubido,
  ) {
    return this.imagenes.capturar(idDetalleOrden, archivo);
  }

  @Put('detalle-orden/:idDetalleOrden/imagenes/orden')
  ordenarImagenes(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number, @Body() dto: OrdenarImagenesDto) {
    return this.imagenes.ordenar(idDetalleOrden, dto.ids);
  }

  @Get('imagenes/:id/archivo')
  async archivoImagen(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, mime } = await this.imagenes.archivo(id);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Patch('imagenes/:id')
  actualizarImagen(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarImagenDto) {
    return this.imagenes.actualizar(id, dto);
  }

  @Delete('imagenes/:id')
  eliminarImagen(@Param('id', ParseIntPipe) id: number) {
    return this.imagenes.eliminar(id);
  }

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
