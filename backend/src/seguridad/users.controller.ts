import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Requiere el permiso 'usuarios' (columna USUARIOS de la tabla users), o ser admin. */
  @RequirePermission('usuarios')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get('me')
  async me(@Req() req: any) {
    const user = await this.usersService.findOneById(req.user.userId);
    return user ? this.usersService.buildPermisosMap(user) : null;
  }
}
