import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('landlord')
  @Roles(Role.LANDLORD)
  getLandlordStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getLandlordStats(user.orgId);
  }

  @Get('admin')
  @Roles(Role.SUPER_ADMIN)
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }
}
