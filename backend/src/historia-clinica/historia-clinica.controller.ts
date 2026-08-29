import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { HistoriaClinicaService } from './historia-clinica.service';
import { UpsertHistoriaClinicaDto } from './dto/upsert-historia-clinica.dto';
import {
  AddHistoriaDiagnosticoDto,
  AddHistoriaMedicamentoDto,
  AddHistoriaLaboratorioDto,
  AddHistoriaProcedimientoDto,
  AddHistoriaRxsDto,
} from './dto/add-historia-item.dto';

@Controller('atenciones/historia-clinica')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('historiaClinica')
export class HistoriaClinicaController {
  constructor(private readonly service: HistoriaClinicaService) {}

  @Get('pendientes')
  findPendientes(@Req() req: any, @Query('q') q?: string) {
    return this.service.findPendientes(req.user.idEmpleado, q);
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
  async upsert(@Body() dto: UpsertHistoriaClinicaDto, @Req() req: any) {
    return this.service.upsert(dto, req.user.idEmpleado);
  }

  @Patch('detalle-orden/:idDetalleOrden/firmar')
  firmar(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.firmar(idDetalleOrden);
  }

  // ---- Diagnósticos ----
  @Get('detalle-orden/:idDetalleOrden/diagnosticos')
  listDiagnosticos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listDiagnosticos(idDetalleOrden);
  }

  @Post('diagnosticos')
  addDiagnostico(@Body() dto: AddHistoriaDiagnosticoDto) {
    return this.service.addDiagnostico(dto);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/diagnosticos/:idDiagnostico')
  removeDiagnostico(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idDiagnostico') idDiagnostico: string,
  ) {
    return this.service.removeDiagnostico(idDetalleOrden, idOrden, idDiagnostico);
  }

  // ---- Medicamentos ----
  @Get('detalle-orden/:idDetalleOrden/medicamentos')
  listMedicamentos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listMedicamentos(idDetalleOrden);
  }

  @Post('medicamentos')
  addMedicamento(@Body() dto: AddHistoriaMedicamentoDto) {
    return this.service.addMedicamento(dto);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/medicamentos/:idMedicamento')
  removeMedicamento(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idMedicamento', ParseIntPipe) idMedicamento: number,
  ) {
    return this.service.removeMedicamento(idDetalleOrden, idOrden, idMedicamento);
  }

  // ---- Laboratorios ----
  @Get('detalle-orden/:idDetalleOrden/laboratorios')
  listLaboratorios(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listLaboratorios(idDetalleOrden);
  }

  @Post('laboratorios')
  addLaboratorio(@Body() dto: AddHistoriaLaboratorioDto) {
    return this.service.addLaboratorio(dto);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/laboratorios/:codigoCups')
  removeLaboratorio(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('codigoCups') codigoCups: string,
  ) {
    return this.service.removeLaboratorio(idDetalleOrden, idOrden, codigoCups);
  }

  // ---- Procedimientos ----
  @Get('detalle-orden/:idDetalleOrden/procedimientos')
  listProcedimientos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listProcedimientos(idDetalleOrden);
  }

  @Post('procedimientos')
  addProcedimiento(@Body() dto: AddHistoriaProcedimientoDto) {
    return this.service.addProcedimiento(dto);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/procedimientos/:codigoCups')
  removeProcedimiento(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('codigoCups') codigoCups: string,
  ) {
    return this.service.removeProcedimiento(idDetalleOrden, idOrden, codigoCups);
  }

  // ---- Revisión por sistemas ----
  @Get('detalle-orden/:idDetalleOrden/rxs')
  listRxs(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listRxs(idDetalleOrden);
  }

  @Post('rxs')
  addRxs(@Body() dto: AddHistoriaRxsDto) {
    return this.service.addRxs(dto);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/rxs/:idRxs')
  removeRxs(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idRxs', ParseIntPipe) idRxs: number,
  ) {
    return this.service.removeRxs(idDetalleOrden, idOrden, idRxs);
  }
}
