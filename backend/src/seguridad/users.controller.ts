import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeOwnPasswordDto } from './dto/change-own-password.dto';

/**
 * Gestión de cuentas de usuario del sistema (tabla `users`). En el VB.NET
 * original esto corresponde al permiso 'Users' (categoría SISTEMA,
 * frmPrivilegios chkUsers) — distinto del permiso 'Usuarios' (categoría
 * PACIENTES, chkUsuarios) que protege el módulo de pacientes. Se aplica por
 * ruta (no a nivel de controller) porque /me debe quedar accesible para
 * cualquier usuario autenticado, no solo para quien administra usuarios.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findOne(req.user.userId);
    return {
      id: user.id,
      usuario: user.usuario,
      admin: user.admin === '1',
      empleado: user.empleado
        ? {
            nombreEmpleado: user.empleado.nombreEmpleado,
            cargo: user.empleado.cargo?.nombreCargo ?? null,
          }
        : null,
      permisos: this.usersService.buildPermisosMap(user),
    };
  }

  /** Autoservicio: cualquier usuario autenticado puede cambiar su propia contraseña (exige la actual). */
  @Patch('me/password')
  async changeOwnPassword(@Req() req: any, @Body() dto: ChangeOwnPasswordDto) {
    await this.usersService.changeOwnPassword(req.user.userId, dto.actual, dto.nueva);
    return { ok: true };
  }

  @RequirePermission('users')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @RequirePermission('users')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @RequirePermission('users')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @RequirePermission('users')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
}
