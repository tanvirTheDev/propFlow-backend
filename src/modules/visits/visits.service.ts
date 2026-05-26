import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role, VisitStatus } from '@prisma/client';
import { differenceInHours } from 'date-fns';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

const VISIT_INCLUDE = {
  property: { select: { id: true, name: true, street: true, city: true, postalCode: true } },
  createdBy: { select: { id: true, name: true } },
  units: {
    include: {
      unit: { select: { id: true, unitNumber: true } },
      tenant: { select: { id: true, name: true, email: true, language: true } },
    },
  },
} as const;

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, dto: CreateVisitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, orgId },
      include: { units: { select: { id: true, tenantId: true } } },
    });
    if (!property) throw new NotFoundException('Property not found');

    const propertyUnitIds = property.units.map((u) => u.id);
    const invalidUnits = dto.units.filter((u) => !propertyUnitIds.includes(u.unitId));
    if (invalidUnits.length) {
      throw new BadRequestException('Some units do not belong to this property');
    }

    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new UnprocessableEntityException('Visit must be scheduled in the future');
    }

    const hoursUntil = differenceInHours(new Date(dto.scheduledAt), new Date());
    const warning = hoursUntil < 24 ? '24h_notice' : undefined;

    const createdBy = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, name: true },
    });

    const visit = await this.prisma.$transaction(async (tx) => {
      const created = await tx.landlordVisit.create({
        data: {
          orgId,
          propertyId: dto.propertyId,
          createdById: userId,
          scheduledAt: new Date(dto.scheduledAt),
          durationMin: dto.durationMin ?? 60,
          reason: dto.reason,
          note: dto.note,
          units: {
            create: dto.units.map((u) => ({
              unitId: u.unitId,
              notifyTenant: u.notifyTenant,
              tenantId: property.units.find((pu) => pu.id === u.unitId)?.tenantId ?? null,
            })),
          },
        },
        include: VISIT_INCLUDE,
      });
      return created;
    });

    await this.enqueueVisitNotifications(orgId, visit, createdBy.name);

    this.logger.log(`Visit ${visit.id} created for org ${orgId}`);
    return { visit, warning };
  }

  async findAll(
    orgId: string,
    userId: string,
    role: Role,
    query: { from?: string; to?: string; status?: VisitStatus; propertyId?: string },
  ) {
    const { from, to, status, propertyId } = query;

    if (role === Role.TENANT) {
      const myUnit = await this.prisma.unit.findFirst({
        where: { tenantId: userId },
        select: { id: true },
      });
      if (!myUnit) return [];

      return this.prisma.landlordVisit.findMany({
        where: {
          orgId,
          ...(status && { status }),
          ...(from && { scheduledAt: { gte: new Date(from) } }),
          ...(to && { scheduledAt: { lte: new Date(to) } }),
          units: { some: { unitId: myUnit.id } },
        },
        include: VISIT_INCLUDE,
        orderBy: { scheduledAt: 'asc' },
      });
    }

    return this.prisma.landlordVisit.findMany({
      where: {
        orgId,
        ...(status && { status }),
        ...(propertyId && { propertyId }),
        ...(from && { scheduledAt: { gte: new Date(from) } }),
        ...(to && { scheduledAt: { lte: new Date(to) } }),
      },
      include: VISIT_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string, orgId: string, userId: string, role: Role) {
    const visit = await this.prisma.landlordVisit.findFirst({
      where: { id, orgId },
      include: VISIT_INCLUDE,
    });
    if (!visit) throw new NotFoundException('Visit not found');

    if (role === Role.TENANT) {
      const myUnit = await this.prisma.unit.findFirst({
        where: { tenantId: userId },
        select: { id: true },
      });
      const hasAccess = visit.units.some((u) => u.unitId === myUnit?.id);
      if (!hasAccess) throw new NotFoundException('Visit not found');
    }

    return visit;
  }

  async update(id: string, orgId: string, userId: string, dto: UpdateVisitDto) {
    const visit = await this.prisma.landlordVisit.findFirst({
      where: { id, orgId },
      include: { property: { include: { units: { select: { id: true, tenantId: true } } } } },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestException('Cannot edit a completed or cancelled visit');
    }

    if (dto.units) {
      const propertyUnitIds = visit.property.units.map((u) => u.id);
      const invalid = dto.units.filter((u) => !propertyUnitIds.includes(u.unitId));
      if (invalid.length) throw new BadRequestException('Some units do not belong to this property');
    }

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : visit.scheduledAt;
    if (scheduledAt <= new Date()) {
      throw new UnprocessableEntityException('Visit must be scheduled in the future');
    }

    const hoursUntil = differenceInHours(scheduledAt, new Date());
    const warning = hoursUntil < 24 ? '24h_notice' : undefined;
    // Re-notify when schedule time changes OR when units/tenants are changed
    const shouldReNotify = dto.scheduledAt !== undefined || dto.units !== undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.units) {
        await tx.landlordVisitUnit.deleteMany({ where: { visitId: id } });
        await tx.landlordVisitUnit.createMany({
          data: dto.units.map((u) => ({
            visitId: id,
            unitId: u.unitId,
            notifyTenant: u.notifyTenant,
            tenantId: visit.property.units.find((pu) => pu.id === u.unitId)?.tenantId ?? null,
          })),
        });
      }

      return tx.landlordVisit.update({
        where: { id },
        data: {
          ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
          ...(dto.durationMin && { durationMin: dto.durationMin }),
          ...(dto.reason && { reason: dto.reason }),
          ...(dto.note !== undefined && { note: dto.note }),
        },
        include: VISIT_INCLUDE,
      });
    });

    if (shouldReNotify) {
      // Cancel old pending notifications then re-enqueue
      await this.prisma.notificationQueue.updateMany({
        where: {
          orgId,
          status: 'PENDING',
          type: 'VISIT_SCHEDULED',
          payload: { path: ['visitId'], equals: id },
        },
        data: { status: 'CANCELLED' },
      });

      const creator = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await this.enqueueVisitNotifications(orgId, updated, creator?.name ?? '');
    }

    return { visit: updated, warning };
  }

  async complete(id: string, orgId: string, note?: string) {
    const visit = await this.prisma.landlordVisit.findFirst({ where: { id, orgId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestException('Visit is not in SCHEDULED status');
    }

    return this.prisma.landlordVisit.update({
      where: { id },
      data: {
        status: VisitStatus.COMPLETED,
        completedAt: new Date(),
        ...(note && { note }),
      },
      include: VISIT_INCLUDE,
    });
  }

  async cancel(id: string, orgId: string, reason?: string) {
    const visit = await this.prisma.landlordVisit.findFirst({ where: { id, orgId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestException('Visit is not in SCHEDULED status');
    }

    // Cancel pending notification queue entries
    await this.prisma.notificationQueue.updateMany({
      where: {
        orgId,
        status: 'PENDING',
        type: 'VISIT_SCHEDULED',
        payload: { path: ['visitId'], equals: id },
      },
      data: { status: 'CANCELLED' },
    });

    return this.prisma.landlordVisit.update({
      where: { id },
      data: {
        status: VisitStatus.CANCELLED,
        ...(reason && { cancelReason: reason }),
      },
      include: VISIT_INCLUDE,
    });
  }

  private async enqueueVisitNotifications(
    orgId: string,
    visit: Awaited<ReturnType<typeof this.prisma.landlordVisit.create>>,
    landlordName: string,
  ) {
    for (const visitUnit of (visit as any).units) {
      if (!visitUnit.notifyTenant || !visitUnit.tenantId) continue;

      await this.prisma.notificationQueue.create({
        data: {
          orgId,
          targetUserId: visitUnit.tenantId,
          type: 'VISIT_SCHEDULED',
          channels: ['EMAIL'],
          payload: {
            visitId: visit.id,
            propertyName: (visit as any).property.name,
            unitId: visitUnit.unitId,
            unitNumber: visitUnit.unit?.unitNumber ?? '',
            scheduledAt: visit.scheduledAt.toISOString(),
            durationMin: visit.durationMin,
            reason: visit.reason,
            note: visit.note ?? null,
            landlordName,
          },
          scheduledAt: new Date(),
        },
      });
    }
  }
}
