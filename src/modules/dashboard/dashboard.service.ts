import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLandlordStats(orgId: string) {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      pendingInvites,
      openTickets,
      inProgressTickets,
      emergencyTickets,
      upcomingVisits,
      recentProperties,
      recentTickets,
    ] = await this.prisma.$transaction([
      this.prisma.property.count({ where: { orgId } }),
      this.prisma.unit.count({ where: { orgId } }),
      this.prisma.unit.count({ where: { orgId, tenantId: { not: null } } }),
      this.prisma.tenantInvite.count({
        where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
      }),
      this.prisma.ticket.count({ where: { orgId, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { orgId, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({
        where: { orgId, isEmergency: true, status: { notIn: ['CLOSED'] } },
      }),
      this.prisma.landlordVisit.count({
        where: {
          orgId,
          status: 'SCHEDULED',
          scheduledAt: { gte: now, lte: in7Days },
        },
      }),
      this.prisma.property.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { _count: { select: { units: true } } },
      }),
      this.prisma.ticket.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          tenant: { select: { id: true, name: true } },
          unit: { select: { id: true, unitNumber: true } },
        },
      }),
    ]);

    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      pendingInvites,
      openTickets,
      inProgressTickets,
      emergencyTickets,
      upcomingVisits,
      recentProperties,
      recentTickets,
    };
  }

  async getAdminStats() {
    const [totalOrgs, totalUsers, totalProperties, totalUnits] = await this.prisma.$transaction([
      this.prisma.organisation.count(),
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.unit.count(),
    ]);

    return { totalOrgs, totalUsers, totalProperties, totalUnits };
  }
}
