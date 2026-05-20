import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

const MESSAGE_INCLUDE = {
  sender: { select: { id: true, name: true } },
  reads: { select: { userId: true, readAt: true } },
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async verifyTicketAccess(user: JwtPayload, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, orgId: user.orgId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (user.role === Role.TENANT && ticket.tenantId !== user.sub) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async listMessages(user: JwtPayload, ticketId: string, dto: ListMessagesDto) {
    await this.verifyTicketAccess(user, ticketId);

    const limit = Math.min(dto.limit ?? 50, 50);

    const messages = await this.prisma.message.findMany({
      where: { ticketId, orgId: user.orgId },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    // Mark messages as read (skip own messages and system messages)
    const toRead = data.filter((m) => m.senderId !== null && m.senderId !== user.sub);
    if (toRead.length > 0) {
      await this.prisma.messageRead.createMany({
        data: toRead.map((m) => ({ messageId: m.id, userId: user.sub })),
        skipDuplicates: true,
      });
    }

    return { data: data.reverse(), nextCursor, hasMore };
  }

  async sendMessage(user: JwtPayload, ticketId: string, dto: SendMessageDto) {
    const ticket = await this.verifyTicketAccess(user, ticketId);

    if (dto.photo) {
      if (
        !dto.photo.startsWith('https://res.cloudinary.com/') ||
        !dto.photo.includes(`/propflow/${user.orgId}/chat/`)
      ) {
        throw new BadRequestException('Invalid photo URL');
      }
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          orgId: user.orgId,
          ticketId,
          senderId: user.sub,
          type: 'USER_MESSAGE',
          content: dto.content,
          photo: dto.photo ?? null,
        },
        include: MESSAGE_INCLUDE,
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: { lastActivity: new Date() },
      });

      return msg;
    });

    // Notify the other party
    const targetUserId =
      user.role === Role.TENANT
        ? (await this.prisma.user.findFirst({ where: { orgId: user.orgId, role: Role.LANDLORD }, select: { id: true } }))?.id
        : ticket.tenantId;

    if (targetUserId) {
      await this.prisma.notificationQueue.create({
        data: {
          orgId: user.orgId,
          targetUserId,
          type: 'MESSAGE_RECEIVED',
          channels: ['PUSH', 'EMAIL'],
          payload: {
            ticketId,
            messageId: message.id,
            senderId: user.sub,
            preview: dto.content.slice(0, 100),
          },
        },
      });
    }

    this.logger.log(`Message sent in ticket ${ticketId} by ${user.sub}`);
    return message;
  }

  async markAllRead(user: JwtPayload, ticketId: string) {
    await this.verifyTicketAccess(user, ticketId);

    const unread = await this.prisma.message.findMany({
      where: {
        ticketId,
        orgId: user.orgId,
        senderId: { not: user.sub },
        type: 'USER_MESSAGE',
        reads: { none: { userId: user.sub } },
      },
      select: { id: true },
    });

    if (unread.length > 0) {
      await this.prisma.messageRead.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId: user.sub })),
        skipDuplicates: true,
      });
    }

    return { markedCount: unread.length };
  }

  async getUnreadCount(user: JwtPayload) {
    const where = {
      orgId: user.orgId,
      type: 'USER_MESSAGE' as const,
      senderId: { not: user.sub },
      reads: { none: { userId: user.sub } },
      ...(user.role === Role.TENANT ? { ticket: { tenantId: user.sub } } : {}),
    };

    const messages = await this.prisma.message.findMany({
      where,
      select: { id: true, ticketId: true },
    });

    const byTicket: Record<string, number> = {};
    for (const msg of messages) {
      byTicket[msg.ticketId] = (byTicket[msg.ticketId] ?? 0) + 1;
    }

    return { count: messages.length, byTicket };
  }
}
