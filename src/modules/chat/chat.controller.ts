import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('tickets/:ticketId/messages')
  listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
    @Query() dto: ListMessagesDto,
  ) {
    return this.chatService.listMessages(user, ticketId, dto);
  }

  @Post('tickets/:ticketId/messages')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user, ticketId, dto);
  }

  @Post('tickets/:ticketId/messages/read-all')
  markAllRead(
    @CurrentUser() user: JwtPayload,
    @Param('ticketId') ticketId: string,
  ) {
    return this.chatService.markAllRead(user, ticketId);
  }

  @Get('messages/unread-count')
  getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.chatService.getUnreadCount(user);
  }
}
