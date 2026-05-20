import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';

@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LANDLORD)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: ListPropertiesDto) {
    return this.propertiesService.findAll(user.orgId, filters);
  }

  @Get('map')
  getMapData(@CurrentUser() user: JwtPayload) {
    return this.propertiesService.getMapData(user.orgId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user.orgId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.propertiesService.findOne(id, user.orgId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, user.orgId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.propertiesService.remove(id, user.orgId);
  }

  @Post(':id/geocode')
  retryGeocode(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.propertiesService.retryGeocode(id, user.orgId);
  }
}
