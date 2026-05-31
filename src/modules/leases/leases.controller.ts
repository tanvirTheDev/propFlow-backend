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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { RecordDepositDto, ReturnDepositDto, TerminateLeaseDto } from './dto/record-deposit.dto';

interface JwtUser {
  sub: string;
  orgId: string;
  role: Role;
}

@Controller('leases')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  @Roles(Role.LANDLORD)
  create(@Body() dto: CreateLeaseDto, @CurrentUser() user: JwtUser) {
    return this.leasesService.create(dto, user.orgId);
  }

  @Get()
  @Roles(Role.LANDLORD)
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('status') status?: string,
    @Query('unitId') unitId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.leasesService.findAll(user.orgId, { status, unitId, tenantId });
  }

  @Get('my-lease')
  @Roles(Role.TENANT)
  myLease(@CurrentUser() user: JwtUser) {
    return this.leasesService.findMyLease(user.sub);
  }

  @Get(':id')
  @Roles(Role.LANDLORD, Role.TENANT)
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.leasesService.findOne(id, user.sub, user.role, user.orgId);
  }

  @Patch(':id')
  @Roles(Role.LANDLORD)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.leasesService.update(id, dto, user.orgId);
  }

  @Post(':id/record-deposit')
  @Roles(Role.LANDLORD)
  recordDeposit(
    @Param('id') id: string,
    @Body() dto: RecordDepositDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.leasesService.recordDeposit(id, dto, user.orgId);
  }

  @Post(':id/return-deposit')
  @Roles(Role.LANDLORD)
  returnDeposit(
    @Param('id') id: string,
    @Body() dto: ReturnDepositDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.leasesService.returnDeposit(id, dto, user.orgId);
  }

  @Post(':id/terminate')
  @Roles(Role.LANDLORD)
  terminate(
    @Param('id') id: string,
    @Body() dto: TerminateLeaseDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.leasesService.terminate(id, dto, user.orgId);
  }
}
