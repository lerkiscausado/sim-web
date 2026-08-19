import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LookupsService } from './lookups.service';

@Controller('catalogos/lookup')
@UseGuards(JwtAuthGuard)
export class LookupsController {
  constructor(private readonly lookupsService: LookupsService) {}

  @Get(':tabla')
  findAll(@Param('tabla') tabla: string) {
    return this.lookupsService.findAll(tabla);
  }
}
