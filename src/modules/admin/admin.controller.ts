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
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { AdminService } from './admin.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AddLandlordDto } from './dto/add-landlord.dto';
import { ListOrgsDto } from './dto/list-orgs.dto';
import { ListQueueDto } from './dto/list-queue.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organisations')
  listOrgs(@Query() dto: ListOrgsDto) {
    return this.adminService.listOrgs(dto);
  }

  @Post('organisations')
  createOrg(@Body() dto: CreateOrgDto) {
    return this.adminService.createOrg(dto);
  }

  @Get('organisations/:id')
  getOrg(@Param('id') id: string) {
    return this.adminService.getOrg(id);
  }

  @Patch('organisations/:id')
  updateOrg(@Param('id') id: string, @Body() dto: UpdateOrgDto) {
    return this.adminService.updateOrg(id, dto);
  }

  @Get('organisations/:id/users')
  listOrgUsers(@Param('id') id: string) {
    return this.adminService.listOrgUsers(id);
  }

  @Post('organisations/:id/landlords')
  addLandlord(@Param('id') id: string, @Body() dto: AddLandlordDto) {
    return this.adminService.addLandlord(id, dto);
  }

  @Delete('users/:userId')
  deactivateUser(@CurrentUser() caller: JwtPayload, @Param('userId') userId: string) {
    return this.adminService.deactivateUser(caller.sub, userId);
  }

  @Post('users/:userId/activate')
  activateUser(@Param('userId') userId: string) {
    return this.adminService.activateUser(userId);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('notification-queue')
  listQueue(@Query() dto: ListQueueDto) {
    return this.adminService.listQueue(dto);
  }
}
