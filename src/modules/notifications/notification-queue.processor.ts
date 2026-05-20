import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processQueue(): Promise<void> {
    // Reset all PROCESSING entries from a previous crashed run.
    // Safe in single-instance: legitimate PROCESSING entries from the prior tick
    // are always finished before the next tick fires (1-minute gap).
    await this.prisma.notificationQueue.updateMany({
      where: { status: 'PROCESSING' },
      data: { status: 'PENDING' },
    });

    // Atomically lock a batch
    const entries = await this.prisma.$transaction(async (tx) => {
      const pending = await tx.notificationQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() },
          attempts: { lt: 3 },
        },
        take: 50,
        orderBy: { scheduledAt: 'asc' },
      });
      if (pending.length === 0) return [];

      await tx.notificationQueue.updateMany({
        where: { id: { in: pending.map((e) => e.id) } },
        data: { status: 'PROCESSING' },
      });
      return pending;
    });

    if (entries.length === 0) return;
    this.logger.log(`Processing ${entries.length} notification(s)`);

    let sent = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.notifications.processEntry(entry);
        await this.prisma.notificationQueue.update({
          where: { id: entry.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        sent++;
      } catch (err) {
        this.logger.error(`Notification ${entry.id} failed: ${(err as Error).message}`);
        const newAttempts = entry.attempts + 1;
        await this.prisma.notificationQueue.update({
          where: { id: entry.id },
          data: {
            status: newAttempts >= 3 ? 'FAILED' : 'PENDING',
            attempts: newAttempts,
          },
        });
        failed++;
      }
    }

    this.logger.log(`Queue run complete: ${sent} sent, ${failed} failed`);
  }
}
