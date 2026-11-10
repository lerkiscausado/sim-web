import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  ConsultaOrdenesService,
  FiltrosConsulta,
} from './consulta-ordenes.service';
import { ArchivosOrdenService } from './archivos-orden.service';
import type { ArchivoSubido } from './archivos-orden.service';
import { CorreoService } from './correo.service';
import { InformesService } from './informes.service';
import { enviarPdf } from '../atenciones/patologia.controller';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

function filtros(q: Record<string, string | undefined>): FiltrosConsulta {
  const num = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
  const fecha = (v?: string) =>
    v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
  return {
    anio: num(q.anio),
    fechaInicio: fecha(q.fechaInicio),
    fechaFin: fecha(q.fechaFin),
    q: q.q?.slice(0, 100),
    estado: q.estado && /^[A-Z]+$/.test(q.estado) ? q.estado : undefined,
    idSede: num(q.idSede),
    idTipoEstudio: num(q.idTipoEstudio),
  };
}

function descarga(res: Response, buffer: Buffer, nombre: string, tipo: string) {
  res.set({
    'Content-Type': tipo,
    'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    'Access-Control-Expose-Headers':
      'Content-Disposition, X-Generados, X-Omitidos',
  });
  res.send(buffer);
}

/**
 * Consultar Órdenes (frmConsultarCDPatologia) y las acciones del menú
 * principal de la licencia 16 que trabajan sobre la orden seleccionada.
 */
@Controller('admisiones/consulta')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConsultaOrdenesController {
  constructor(
    private readonly consulta: ConsultaOrdenesService,
    private readonly archivos: ArchivosOrdenService,
    private readonly correo: CorreoService,
    private readonly informes: InformesService,
  ) {}

  @Get()
  @RequirePermission('consultar')
  listar(@Query() q: Record<string, string>) {
    return this.consulta.listar(
      filtros(q),
      Number(q.page) || 1,
      Number(q.pageSize) || 50,
    );
  }

  @Get('anios')
  @RequirePermission('consultar')
  anios() {
    return this.consulta.aniosDisponibles();
  }

  @Get('exportar/excel')
  @RequirePermission('consultar')
  async excel(@Query() q: Record<string, string>, @Res() res: Response) {
    const buffer = await this.consulta.exportarExcel(filtros(q));
    descarga(
      res,
      buffer,
      `Ordenes ${new Date().toISOString().slice(0, 10)}.xlsx`,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  }

  @Get('exportar/pdf')
  @RequirePermission('consultar')
  async pdfGrilla(@Query() q: Record<string, string>, @Res() res: Response) {
    const buffer = await this.consulta.exportarPdf(filtros(q));
    enviarPdf(
      res,
      buffer,
      `Ordenes ${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  }

  /** Exportar Lote PDF: ids explícitos o, si no se envían, las órdenes filtradas (máx. 300). */
  @Post('exportar/lote')
  @RequirePermission('imprimir')
  async lote(
    @Body() body: { ids?: number[]; filtros?: Record<string, string> },
    @Res() res: Response,
  ) {
    const ids = body.ids?.length
      ? body.ids
      : await this.consulta.idsParaLote(filtros(body.filtros ?? {}));
    const r = await this.consulta.lote(ids);
    res.set({
      'X-Generados': String(r.generados),
      'X-Omitidos': String(r.omitidos.length),
    });
    descarga(
      res,
      r.zip,
      `Resultados ${new Date().toISOString().slice(0, 10)}.zip`,
      'application/zip',
    );
  }

  @Get('relacion-patologias/pdf')
  @RequirePermission('imprimir')
  async relacion(@Query('fecha') fecha: string, @Res() res: Response) {
    const buffer = await this.consulta.relacionPatologias(fecha);
    enviarPdf(res, buffer, `Relacion patologias ${fecha}.pdf`);
  }

  // ───────── informes (frmInformes) ─────────

  @Get('informes')
  @RequirePermission('consultar')
  listarInformes(@Req() req: any) {
    return this.informes.listar(Boolean(req.user?.admin));
  }

  @Post('informes/:id/ejecutar')
  @RequirePermission('consultar')
  ejecutarInforme(@Param('id', ParseIntPipe) id: number) {
    return this.informes.ejecutar(id);
  }

  @Post('informes')
  guardarInforme(
    @Body()
    body: {
      id?: number;
      nombre: string;
      query: string;
      estado?: EstadoActivoInactivo;
    },
    @Req() req: any,
  ) {
    if (!req.user?.admin)
      throw new ForbiddenException(
        'Solo el ADMINISTRADOR puede crear o editar informes',
      );
    return this.informes.guardar(body);
  }

  // ───────── acciones sobre una orden ─────────

  /** Reporte de estudios / Imprimir estudios: informe de patología o citología de la orden. */
  @Get(':idOrden/estudio/pdf')
  @RequirePermission('imprimir')
  async estudio(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Res() res: Response,
    @Query('variante') variante?: string,
    @Query('descargar') descargar?: string,
  ) {
    const { buffer, nombreArchivo } = await this.consulta.pdfEstudio(
      idOrden,
      variante,
    );
    enviarPdf(res, buffer, nombreArchivo, descargar === '1');
  }

  @Get(':idOrden/entrega-resultados/pdf')
  @RequirePermission('imprimir')
  async entrega(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Res() res: Response,
  ) {
    const { buffer, nombreArchivo } =
      await this.consulta.reciboEntrega(idOrden);
    enviarPdf(res, buffer, nombreArchivo);
  }

  @Get('correo/estado')
  @RequirePermission('consultar')
  estadoCorreo() {
    return { configurado: this.correo.configurado() };
  }

  /** Enviar Correo (frmMail): envía el informe en PDF al paciente. */
  @Post(':idOrden/correo')
  @RequirePermission('imprimir')
  async enviarCorreo(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Body() body: { para: string; asunto?: string; mensaje?: string },
  ) {
    if (!body?.para)
      throw new BadRequestException('Indique el correo del destinatario');
    const { buffer, nombreArchivo } = await this.consulta.pdfEstudio(idOrden);
    return this.correo.enviar({
      para: body.para,
      asunto: body.asunto?.trim() || 'Resultado de estudio',
      mensaje:
        body.mensaje?.trim() ||
        'Cordial saludo.\n\nAdjuntamos el resultado de su estudio.\n\nCLÍNICA DE DIAGNOSTICO AVANZADO Y PATOLOGÍA ONCOLÓGICA',
      adjuntos: [{ nombre: nombreArchivo, contenido: buffer }],
    });
  }

  // ───────── adjuntos (frmAdjuntos) ─────────

  @Get(':idOrden/adjuntos')
  @RequirePermission('adjuntos')
  adjuntos(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.archivos.listarAdjuntos(idOrden);
  }

  @Post(':idOrden/adjuntos')
  @RequirePermission('adjuntos')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: 26 * 1024 * 1024 } }),
  )
  subirAdjunto(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Body('nombre') nombre: string,
    @UploadedFile() archivo?: ArchivoSubido,
  ) {
    return this.archivos.subirAdjunto(idOrden, nombre, archivo);
  }

  @Get('adjuntos/:id/archivo')
  @RequirePermission('adjuntos')
  async verAdjunto(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, nombre } = await this.archivos.archivoAdjunto(id);
    enviarPdf(res, buffer, nombre);
  }

  @Delete('adjuntos/:id')
  @RequirePermission('adjuntos')
  eliminarAdjunto(@Param('id', ParseIntPipe) id: number) {
    return this.archivos.eliminarAdjunto(id);
  }

  // ───────── imágenes del estudio (frmImagenesVideo) ─────────

  @Get(':idOrden/imagenes')
  @RequirePermission('adjuntarImagenes')
  imagenes(@Param('idOrden', ParseIntPipe) idOrden: number) {
    return this.archivos.listarImagenes(idOrden);
  }

  @Post(':idOrden/imagenes')
  @RequirePermission('adjuntarImagenes')
  @UseInterceptors(
    FilesInterceptor('imagenes', 20, {
      limits: { fileSize: 11 * 1024 * 1024 },
    }),
  )
  subirImagenes(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @UploadedFiles() archivos: ArchivoSubido[],
    @Body('texto') texto?: string,
  ) {
    return this.archivos.subirImagenes(idOrden, archivos, texto);
  }

  @Get('imagenes/:id/archivo')
  @RequirePermission('adjuntarImagenes')
  async verImagen(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, mime } = await this.archivos.archivoImagen(id);
    res.set({ 'Content-Type': mime, 'Cache-Control': 'private, max-age=3600' });
    res.send(buffer);
  }

  @Patch('imagenes/:id')
  @RequirePermission('adjuntarImagenes')
  textoImagen(
    @Param('id', ParseIntPipe) id: number,
    @Body('texto') texto: string,
  ) {
    return this.archivos.actualizarTextoImagen(id, texto);
  }

  @Delete('imagenes/:id')
  @RequirePermission('adjuntarImagenes')
  eliminarImagen(@Param('id', ParseIntPipe) id: number) {
    return this.archivos.eliminarImagen(id);
  }
}
