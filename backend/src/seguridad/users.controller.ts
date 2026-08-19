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
    const user = await this.usersService.findOneById(req.user.userId);
    return user ? this.usersService.buildPermisosMap(user) : null;
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
