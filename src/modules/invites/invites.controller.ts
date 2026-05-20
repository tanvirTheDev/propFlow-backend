import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.LANDLORD)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.invitesService.findAll(user.orgId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInviteDto) {
    return this.invitesService.create(user.orgId, dto);
  }

  @Post(':id/resend')
  resend(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invitesService.resend(id, user.orgId);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.invitesService.cancel(id, user.orgId);
  }
}
