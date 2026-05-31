import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { addDays, differenceInDays } from 'date-fns';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class LeasesCron {
  private readonly logger = new Logger(LeasesCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 9 * * *')
  async checkLeaseExpiry() {
    this.logger.log('Running lease expiry check…');
    const now = new Date();

    const leases = await this.prisma.lease.findMany({
      where: {
        leaseType: 'FIXED_TERM',
        status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
        endDate: { not: null, lte: addDays(now, 90) },
      },
      include: {
        tenant: { select: { name: true } },
        unit: { include: { property: { select: { name: true } } } },
      },
    });

    for (const lease of leases) {
      if (!lease.endDate) continue;
      const daysLeft = differenceInDays(new Date(lease.endDate), now);

      if (daysLeft <= 0) {
        if (lease.status !== 'EXPIRED') {
          await this.prisma.lease.update({ where: { id: lease.id }, data: { status: 'EXPIRED' } });
        }
        continue;
      }

      if (daysLeft <= 90 && daysLeft > 60 && !lease.alert90SentAt) {
        await this.sendLeaseAlert(lease, 90, daysLeft, now);
        await this.prisma.lease.update({
          where: { id: lease.id },
          data: { status: 'EXPIRING_SOON', alert90SentAt: now },
        });
      } else if (daysLeft <= 60 && daysLeft > 30 && !lease.alert60SentAt) {
        await this.sendLeaseAlert(lease, 60, daysLeft, now);
        await this.prisma.lease.update({
          where: { id: lease.id },
          data: { alert60SentAt: now },
        });
      } else if (daysLeft <= 30 && !lease.alert30SentAt) {
        await this.sendLeaseAlert(lease, 30, daysLeft, now);
        await this.prisma.lease.update({
          where: { id: lease.id },
          data: { alert30SentAt: now },
        });
      }
    }
  }

  private async sendLeaseAlert(
    lease: { id: string; orgId: string; unitId: string; tenant: { name: string }; unit: { unitNumber: string; property: { name: string } } },
    daysAlert: number,
    daysLeft: number,
    now: Date,
  ) {
    const landlords = await this.prisma.user.findMany({
      where: { orgId: lease.orgId, role: Role.LANDLORD },
    });

    for (const landlord of landlords) {
      await this.prisma.notificationQueue.create({
        data: {
          orgId: lease.orgId,
          targetUserId: landlord.id,
          type: `LEASE_EXPIRING_${daysAlert}D`,
          channels: ['EMAIL'],
          payload: {
            leaseId: lease.id,
            tenantName: lease.tenant.name,
            unitNumber: lease.unit.unitNumber,
            propertyName: lease.unit.property.name,
            daysLeft,
          },
          scheduledAt: now,
        },
      });
    }

    this.logger.log(`Queued ${daysAlert}-day lease alert for lease ${lease.id}`);
  }
}
