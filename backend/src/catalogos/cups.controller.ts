import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CupsService } from './cups.service';
import { CreateCupsDto } from './dto/create-cups.dto';
import { EstadoActivoInactivo } from '../common/enums/estado.enum';

@Controller('catalogos/cups')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CupsController {
  constructor(private readonly cupsService: CupsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('estado') estado?: string,
  ) {
    return this.cupsService.findAll(page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, q, estado);
  }

  /** Sin paginar, para autocompletados. */
  @Get('search')
  search(@Query('q') q: string) {
    return this.cupsService.search(q);
  }

  @Get(':codigo')
  findOne(@Param('codigo') codigo: string) {
    return this.cupsService.findOne(codigo);
  }

  @RequirePermission('cups')
  @Post()
  create(@Body() dto: CreateCupsDto) {
    return this.cupsService.create(dto);
  }

  @RequirePermission('cups')
  @Patch(':codigo')
  update(@Param('codigo') codigo: string, @Body() dto: Partial<CreateCupsDto>) {
    return this.cupsService.update(codigo, dto);
  }

  @RequirePermission('cups')
  @Patch(':codigo/estado/:estado')
  cambiarEstado(@Param('codigo') codigo: string, @Param('estado') estado: EstadoActivoInactivo) {
    return this.cupsService.cambiarEstado(codigo, estado);
  }
}
