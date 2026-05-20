import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { subDays } from 'date-fns';
import { PrismaService } from '@/prisma/prisma.service';

const PENDING_DAYS_THRESHOLD = 3;

@Injectable()
export class ReminderCron {
  private readonly logger = new Logger(ReminderCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingTickets(): Promise<void> {
    const threshold = subDays(new Date(), PENDING_DAYS_THRESHOLD);

    const staleTickets = await this.prisma.ticket.findMany({
      where: {
        status: 'OPEN',
        updatedAt: { lte: threshold },
      },
      include: {
        unit: {
          include: {
            property: { select: { name: true, street: true, city: true } },
          },
        },
        tenant: { select: { id: true, name: true } },
        org: { select: { id: true } },
      },
    });

    if (staleTickets.length === 0) return;
    this.logger.log(`Found ${staleTickets.length} stale ticket(s) to remind`);

    for (const ticket of staleTickets) {
      // Check if a pending reminder was already queued recently (within 24h)
      const existing = await this.prisma.notificationQueue.findFirst({
        where: {
          orgId: ticket.orgId,
          type: 'TICKET_PENDING_REMINDER',
          payload: { path: ['ticketId'], equals: ticket.id },
          createdAt: { gte: subDays(new Date(), 1) },
        },
      });
      if (existing) continue;

      // Find the landlord for this org
      const landlord = await this.prisma.user.findFirst({
        where: { orgId: ticket.orgId, role: 'LANDLORD' },
        select: { id: true },
      });
      if (!landlord) continue;

      const daysOpen = Math.floor(
        (Date.now() - ticket.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      await this.prisma.notificationQueue.create({
        data: {
          orgId: ticket.orgId,
          targetUserId: landlord.id,
          type: 'TICKET_PENDING_REMINDER',
          channels: ['EMAIL'],
          scheduledAt: new Date(),
          payload: {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            ticketNumber: ticket.ticketNumber,
            tenantName: ticket.tenant.name,
            unitNumber: ticket.unit.unitNumber,
            propertyName: ticket.unit.property.name,
            daysOpen,
          },
        },
      });
    }
  }
}
