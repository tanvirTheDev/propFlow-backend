import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { NotificationsService } from './notifications.service';
import { SavePushSubscriptionDto } from './dto/save-push-subscription.dto';
import { ListInAppDto } from './dto/list-in-app.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('push-subscription')
  async savePushSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SavePushSubscriptionDto,
  ) {
    await this.service.savePushSubscription(user.sub, dto.subscription);
    return { success: true };
  }

  @Delete('push-subscription')
  async removePushSubscription(@CurrentUser() user: JwtPayload) {
    await this.service.removePushSubscription(user.sub);
    return { success: true };
  }

  @Get('in-app')
  listInApp(@CurrentUser() user: JwtPayload, @Query() dto: ListInAppDto) {
    return this.service.listInApp(user.sub, dto);
  }

  @Patch('in-app/:id/read')
  async markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    try {
      return await this.service.markRead(user.sub, id);
    } catch {
      throw new NotFoundException('Notification not found');
    }
  }

  @Post('in-app/read-all')
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.service.markAllRead(user.sub);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.service.getUnreadCount(user.sub);
  }
}
