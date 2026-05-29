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
import { Role, VisitStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { IsOptional, IsString } from 'class-validator';

class VisitQueryDto {
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() status?: VisitStatus;
  @IsOptional() @IsString() propertyId?: string;
}

@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(Role.LANDLORD)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVisitDto) {
    return this.visitsService.create(user.orgId, user.sub, dto);
  }

  @Get()
  @Roles(Role.LANDLORD, Role.TENANT)
  findAll(@CurrentUser() user: JwtPayload, @Query() query: VisitQueryDto) {
    return this.visitsService.findAll(user.orgId, user.sub, user.role as Role, query);
  }

  @Get(':id')
  @Roles(Role.LANDLORD, Role.TENANT)
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.visitsService.findOne(id, user.orgId, user.sub, user.role as Role);
  }

  @Patch(':id')
  @Roles(Role.LANDLORD)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVisitDto,
  ) {
    return this.visitsService.update(id, user.orgId, user.sub, dto);
  }

  @Post(':id/complete')
  @Roles(Role.LANDLORD)
  complete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('note') note?: string,
    @Body('endTime') endTime?: string,
  ) {
    return this.visitsService.complete(id, user.orgId, note, endTime);
  }

  @Post(':id/cancel')
  @Roles(Role.LANDLORD)
  cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.visitsService.cancel(id, user.orgId, reason);
  }
}
