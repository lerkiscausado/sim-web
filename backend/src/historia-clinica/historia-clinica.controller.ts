import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { HistoriaClinicaService } from './historia-clinica.service';
import { UpsertHistoriaClinicaDto } from './dto/upsert-historia-clinica.dto';
import { GuardarAntecedentesDto } from './dto/guardar-antecedentes.dto';
import { AddAdendaDto } from './dto/add-adenda.dto';
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

  /** Historias ya firmadas por el especialista (para consultarlas y agregar adendas). */
  @Get('firmadas')
  findFirmadas(@Req() req: any, @Query('q') q?: string) {
    return this.service.findFirmadas(req.user.idEmpleado, q);
  }

  @Get('orden/:idOrden/antecedentes')
  antecedentes(@Param('idOrden', ParseIntPipe) idOrden: number, @Query('idUsuario', ParseIntPipe) idUsuario: number) {
    return this.service.antecedentes(idOrden, idUsuario);
  }

  @Put('antecedentes')
  guardarAntecedentes(@Body() dto: GuardarAntecedentesDto, @Req() req: any) {
    return this.service.guardarAntecedentes(dto, req.user.idEmpleado);
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

  @Get('detalle-orden/:idDetalleOrden/trazabilidad')
  trazabilidad(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listTrazabilidad(idDetalleOrden);
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
  firmar(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number, @Req() req: any) {
    return this.service.firmar(idDetalleOrden, req.user.idEmpleado);
  }

  // ---- Diagnósticos ----
  @Get('detalle-orden/:idDetalleOrden/diagnosticos')
  listDiagnosticos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listDiagnosticos(idDetalleOrden);
  }

  @Post('diagnosticos')
  addDiagnostico(@Body() dto: AddHistoriaDiagnosticoDto, @Req() req: any) {
    return this.service.addDiagnostico(dto, req.user.idEmpleado);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/diagnosticos/:idDiagnostico')
  removeDiagnostico(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idDiagnostico') idDiagnostico: string,
    @Req() req: any,
  ) {
    return this.service.removeDiagnostico(idDetalleOrden, idOrden, idDiagnostico, req.user.idEmpleado);
  }

  // ---- Medicamentos ----
  @Get('detalle-orden/:idDetalleOrden/medicamentos')
  listMedicamentos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listMedicamentos(idDetalleOrden);
  }

  @Post('medicamentos')
  addMedicamento(@Body() dto: AddHistoriaMedicamentoDto, @Req() req: any) {
    return this.service.addMedicamento(dto, req.user.idEmpleado);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/medicamentos/:idMedicamento')
  removeMedicamento(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idMedicamento', ParseIntPipe) idMedicamento: number,
    @Req() req: any,
  ) {
    return this.service.removeMedicamento(idDetalleOrden, idOrden, idMedicamento, req.user.idEmpleado);
  }

  // ---- Laboratorios ----
  @Get('detalle-orden/:idDetalleOrden/laboratorios')
  listLaboratorios(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listLaboratorios(idDetalleOrden);
  }

  @Post('laboratorios')
  addLaboratorio(@Body() dto: AddHistoriaLaboratorioDto, @Req() req: any) {
    return this.service.addLaboratorio(dto, req.user.idEmpleado);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/laboratorios/:codigoCups')
  removeLaboratorio(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('codigoCups') codigoCups: string,
    @Req() req: any,
  ) {
    return this.service.removeLaboratorio(idDetalleOrden, idOrden, codigoCups, req.user.idEmpleado);
  }

  // ---- Procedimientos ----
  @Get('detalle-orden/:idDetalleOrden/procedimientos')
  listProcedimientos(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listProcedimientos(idDetalleOrden);
  }

  @Post('procedimientos')
  addProcedimiento(@Body() dto: AddHistoriaProcedimientoDto, @Req() req: any) {
    return this.service.addProcedimiento(dto, req.user.idEmpleado);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/procedimientos/:codigoCups')
  removeProcedimiento(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('codigoCups') codigoCups: string,
    @Req() req: any,
  ) {
    return this.service.removeProcedimiento(idDetalleOrden, idOrden, codigoCups, req.user.idEmpleado);
  }

  // ---- Revisión por sistemas ----
  @Get('detalle-orden/:idDetalleOrden/rxs')
  listRxs(@Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number) {
    return this.service.listRxs(idDetalleOrden);
  }

  @Post('rxs')
  addRxs(@Body() dto: AddHistoriaRxsDto, @Req() req: any) {
    return this.service.addRxs(dto, req.user.idEmpleado);
  }

  @Delete('detalle-orden/:idDetalleOrden/orden/:idOrden/rxs/:idRxs')
  removeRxs(
    @Param('idDetalleOrden', ParseIntPipe) idDetalleOrden: number,
    @Param('idOrden', ParseIntPipe) idOrden: number,
    @Param('idRxs', ParseIntPipe) idRxs: number,
    @Req() req: any,
  ) {
    return this.service.removeRxs(idDetalleOrden, idOrden, idRxs, req.user.idEmpleado);
  }
}
