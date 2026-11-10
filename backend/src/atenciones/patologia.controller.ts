import {
  BadRequestException,
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
import { PatologiaPdfService, VarianteInforme } from './patologia-pdf.service';
import { UpsertPatologiaDto } from './dto/upsert-patologia.dto';

const VARIANTES = ['auto', 'final', 'CD', 'NUESTRA', 'BOSQUE', 'PRELIMINAR'];

export function enviarPdf(
  res: Response,
  buffer: Buffer,
  nombreArchivo: string,
  descargar = false,
) {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${descargar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`,
    'Access-Control-Expose-Headers': 'Content-Disposition',
  });
  res.send(buffer);
}

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
    return this.patologiaService.findPendientes(
      idSede ? Number(idSede) : undefined,
      q,
    );
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

  /** Firma el estudio (chkProcesado del VB.NET): la orden pasa a ATENDIDO. */
  @Post('orden/:idOrden/firmar')
  firmar(@Param('idOrden', ParseIntPipe) idOrden: number, @Req() req: any) {
    return this.patologiaService.firmar(idOrden, req.user.idEmpleado);
  }

  /**
   * Informe en PDF. variante:
   * - auto (defecto): firmado → reporte de su sede; sin firmar → preliminar
   * - final: reporte de la sede (vista previa desde el formulario de patología)
   * - CD | NUESTRA | BOSQUE | PRELIMINAR: forzar un formato
   */
  @Get('orden/:idOrden/pdf')
  async descargarPdf(
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Res() res: Response,
    @Query('variante') variante?: string,
    @Query('descargar') descargar?: string,
  ) {
    if (variante && !VARIANTES.includes(variante))
      throw new BadRequestException(`Variante inválida: ${variante}`);
    const { buffer, nombreArchivo } = await this.patologiaPdfService.generar(
      idOrden,
      {
        variante: (variante as VarianteInforme | 'auto' | 'final') ?? 'auto',
      },
    );
    enviarPdf(res, buffer, nombreArchivo, descargar === '1');
  }
}
