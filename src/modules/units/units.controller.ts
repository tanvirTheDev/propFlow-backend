import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('properties/:propertyId/units')
  @Roles(Role.LANDLORD)
  findAllByProperty(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
  ) {
    return this.unitsService.findAllByProperty(propertyId, user.orgId);
  }

  @Post('properties/:propertyId/units')
  @Roles(Role.LANDLORD)
  create(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.create(propertyId, user.orgId, dto);
  }

  @Get('units/my-unit')
  @Roles(Role.TENANT)
  findMyUnit(@CurrentUser() user: JwtPayload) {
    return this.unitsService.findMyUnit(user.sub, user.orgId);
  }

  @Get('units/:id')
  @Roles(Role.LANDLORD)
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.unitsService.findOne(id, user.orgId);
  }

  @Patch('units/:id')
  @Roles(Role.LANDLORD)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitsService.update(id, user.orgId, dto);
  }

  @Delete('units/:id')
  @Roles(Role.LANDLORD)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.unitsService.remove(id, user.orgId);
  }

  @Delete('units/:id/tenant')
  @Roles(Role.LANDLORD)
  removeTenant(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.unitsService.removeTenant(id, user.orgId);
  }
}
