import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AddLandlordDto } from './dto/add-landlord.dto';
import { ListOrgsDto } from './dto/list-orgs.dto';
import { ListQueueDto } from './dto/list-queue.dto';

const BCRYPT_ROUNDS = 12;

const USER_SAFE_SELECT = {
  id: true, orgId: true, role: true, name: true,
  email: true, phone: true, language: true, isActive: true,
  emailVerified: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrgs(dto: ListOrgsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = dto.search
      ? { name: { contains: dto.search, mode: 'insensitive' as const } }
      : {};

    const [organisations, total] = await this.prisma.$transaction([
      this.prisma.organisation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { properties: true, tickets: true } } },
      }),
      this.prisma.organisation.count({ where }),
    ]);

    const orgIds = organisations.map((o) => o.id);

    const countByOrg = (rows: { orgId: string }[]): Map<string, number> =>
      rows.reduce((m, r) => m.set(r.orgId, (m.get(r.orgId) ?? 0) + 1), new Map<string, number>());

    const [landlords, tenants, units] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where: { orgId: { in: orgIds }, role: Role.LANDLORD }, select: { orgId: true } }),
      this.prisma.user.findMany({ where: { orgId: { in: orgIds }, role: Role.TENANT }, select: { orgId: true } }),
      this.prisma.unit.findMany({ where: { orgId: { in: orgIds } }, select: { orgId: true } }),
    ]);

    const landlordMap = countByOrg(landlords);
    const tenantMap = countByOrg(tenants);
    const unitMap = countByOrg(units);

    const data = organisations.map((org) => ({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      landlordCount: landlordMap.get(org.id) ?? 0,
      tenantCount: tenantMap.get(org.id) ?? 0,
      propertyCount: org._count.properties,
      unitCount: unitMap.get(org.id) ?? 0,
      ticketCount: org._count.tickets,
    }));

    return { data, total, page };
  }

  async createOrg(dto: CreateOrgDto) {
    const hashedPassword = await bcrypt.hash(dto.landlordPassword, BCRYPT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: dto.landlordEmail } });
      if (existing) throw new ConflictException('Email already registered');

      const organisation = await tx.organisation.create({
        data: { name: dto.orgName },
      });
      const user = await tx.user.create({
        data: {
          orgId: organisation.id,
          role: Role.LANDLORD,
          name: dto.landlordName,
          email: dto.landlordEmail,
          password: hashedPassword,
        },
        select: USER_SAFE_SELECT,
      });
      return { organisation, user };
    });
  }

  async getOrg(id: string) {
    const org = await this.prisma.organisation.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, properties: true, tickets: true } },
      },
    });
    if (!org) throw new NotFoundException('Organisation not found');

    const [landlordCount, tenantCount, unitCount] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { orgId: id, role: Role.LANDLORD } }),
      this.prisma.user.count({ where: { orgId: id, role: Role.TENANT } }),
      this.prisma.unit.count({ where: { orgId: id } }),
    ]);

    return {
      id: org.id,
      name: org.name,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      landlordCount,
      tenantCount,
      propertyCount: org._count.properties,
      unitCount,
      ticketCount: org._count.tickets,
      userCount: org._count.users,
    };
  }

  async updateOrg(id: string, dto: UpdateOrgDto) {
    await this.getOrg(id);
    return this.prisma.organisation.update({ where: { id }, data: { name: dto.name } });
  }

  async listOrgUsers(orgId: string) {
    await this.getOrg(orgId);
    return this.prisma.user.findMany({
      where: { orgId },
      select: USER_SAFE_SELECT,
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async addLandlord(orgId: string, dto: AddLandlordDto) {
    await this.getOrg(orgId);
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already registered');
      return tx.user.create({
        data: { orgId, role: Role.LANDLORD, name: dto.name, email: dto.email, password: hashedPassword },
        select: USER_SAFE_SELECT,
      });
    });
  }

  async deactivateUser(callerId: string, userId: string) {
    if (callerId === userId) throw new ForbiddenException('Cannot deactivate your own account');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isActive) throw new BadRequestException('User is already deactivated');
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false, refreshToken: null },
    });
    return { success: true };
  }

  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('User is already active');
    await this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
    return { success: true };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      organisations,
      landlords,
      tenants,
      properties,
      units,
      totalTickets,
      openTickets,
      inProgressTickets,
      emergencies,
      emailsSentToday,
      failedNotifications,
    ] = await this.prisma.$transaction([
      this.prisma.organisation.count(),
      this.prisma.user.count({ where: { role: Role.LANDLORD } }),
      this.prisma.user.count({ where: { role: Role.TENANT } }),
      this.prisma.property.count(),
      this.prisma.unit.count(),
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { isEmergency: true, status: { notIn: ['CLOSED'] } } }),
      this.prisma.notificationQueue.count({
        where: { status: 'SENT', sentAt: { gte: today } },
      }),
      this.prisma.notificationQueue.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      organisations,
      landlords,
      tenants,
      properties,
      units,
      tickets: { total: totalTickets, open: openTickets, inProgress: inProgressTickets, emergencies },
      emailsSentToday,
      failedNotifications,
    };
  }

  async listQueue(dto: ListQueueDto) {
    return this.prisma.notificationQueue.findMany({
      where: dto.status ? { status: dto.status } : {},
      orderBy: { createdAt: 'desc' },
      take: dto.limit ?? 50,
      select: {
        id: true, orgId: true, targetUserId: true, type: true,
        channels: true, status: true, attempts: true,
        scheduledAt: true, sentAt: true, createdAt: true,
      },
    });
  }
}
