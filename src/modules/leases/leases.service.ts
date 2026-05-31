import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInDays } from 'date-fns';
import { PrismaService } from '@/prisma/prisma.service';
import { Role, Lease } from '@prisma/client';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { RecordDepositDto, ReturnDepositDto, TerminateLeaseDto } from './dto/record-deposit.dto';

const LEASE_INCLUDE = {
  unit: {
    include: {
      property: { select: { id: true, name: true, street: true, city: true } },
    },
  },
  tenant: { select: { id: true, name: true, email: true } },
} as const;

function computeStatus(lease: Lease): Lease['status'] {
  if (lease.status === 'TERMINATED') return 'TERMINATED';
  if (!lease.endDate) return 'ACTIVE';
  const daysLeft = differenceInDays(new Date(lease.endDate), new Date());
  if (daysLeft <= 0) return 'EXPIRED';
  if (daysLeft <= 90) return 'EXPIRING_SOON';
  return 'ACTIVE';
}

function enrichLease(lease: Lease & { unit?: unknown; tenant?: unknown }) {
  const status = computeStatus(lease);
  const daysUntilExpiry = lease.endDate
    ? differenceInDays(new Date(lease.endDate), new Date())
    : null;
  return { ...lease, status, daysUntilExpiry };
}

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeaseDto, orgId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, orgId },
    });
    if (!unit) throw new NotFoundException('Unit not found');

    const tenant = await this.prisma.user.findFirst({
      where: { id: dto.tenantId, orgId, role: Role.TENANT },
    });
    if (!tenant) throw new NotFoundException('Tenant not found in this organisation');

    const existing = await this.prisma.lease.findFirst({
      where: { unitId: dto.unitId, status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
    });
    if (existing) throw new ConflictException('This unit already has an active lease');

    if (dto.leaseType === 'FIXED_TERM' && !dto.endDate) {
      throw new BadRequestException('End date is required for fixed-term leases');
    }
    if (dto.endDate && dto.startDate >= dto.endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const maxDeposit = dto.coldRent * 3;
    if (dto.depositAmount > maxDeposit) {
      throw new BadRequestException(
        `Deposit cannot exceed 3 months cold rent (max €${maxDeposit.toFixed(2)}) — §551 BGB`,
      );
    }

    const totalRent = dto.coldRent + dto.utilitiesAdvance;

    const lease = await this.prisma.lease.create({
      data: {
        orgId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        leaseType: dto.leaseType,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        noticePeriodMonths: dto.noticePeriodMonths ?? 3,
        coldRent: Number(dto.coldRent),
        utilitiesAdvance: Number(dto.utilitiesAdvance),
        totalRent: Number(totalRent),
        depositAmount: Number(dto.depositAmount),
        depositReceivedDate: dto.depositReceivedDate ? new Date(dto.depositReceivedDate) : null,
        notes: dto.notes,
      },
      include: LEASE_INCLUDE,
    });

    return enrichLease(lease);
  }

  async findAll(orgId: string, query: { status?: string; unitId?: string; tenantId?: string }) {
    const where: Record<string, unknown> = { orgId };
    if (query.unitId) where['unitId'] = query.unitId;
    if (query.tenantId) where['tenantId'] = query.tenantId;

    const leases = await this.prisma.lease.findMany({
      where,
      include: LEASE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    const enriched = leases.map(enrichLease);

    if (query.status) {
      return enriched.filter((l: ReturnType<typeof enrichLease>) => l.status === query.status);
    }
    return enriched;
  }

  async findMyLease(tenantId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { tenantId },
      include: LEASE_INCLUDE,
    });
    if (!lease) throw new NotFoundException('No lease found');
    return enrichLease(lease);
  }

  async findOne(id: string, userId: string, role: Role, orgId: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { id, orgId },
      include: LEASE_INCLUDE,
    });
    if (!lease) throw new NotFoundException('Lease not found');

    if (role === Role.TENANT && lease.tenantId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return enrichLease(lease);
  }

  async update(id: string, dto: UpdateLeaseDto, orgId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!lease) throw new NotFoundException('Lease not found');
    if (lease.status === 'TERMINATED' || lease.status === 'EXPIRED') {
      throw new BadRequestException('Cannot update a terminated or expired lease');
    }

    // UpdateLeaseDto is PartialType(CreateLeaseDto) — cast for safe property access
    const d = dto as Partial<import('./dto/create-lease.dto').CreateLeaseDto>;

    if (d.leaseType === 'FIXED_TERM' && !d.endDate && !lease.endDate) {
      throw new BadRequestException('End date is required for fixed-term leases');
    }

    const coldRent = d.coldRent ?? Number(lease.coldRent);
    const utilitiesAdvance = d.utilitiesAdvance ?? Number(lease.utilitiesAdvance);
    const totalRent = coldRent + utilitiesAdvance;

    if (d.depositAmount !== undefined) {
      const maxDeposit = coldRent * 3;
      if (d.depositAmount > maxDeposit) {
        throw new BadRequestException(
          `Deposit cannot exceed 3 months cold rent (max €${maxDeposit.toFixed(2)}) — §551 BGB`,
        );
      }
    }

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        ...(d.leaseType && { leaseType: d.leaseType }),
        ...(d.startDate && { startDate: new Date(d.startDate) }),
        ...(d.endDate !== undefined && { endDate: d.endDate ? new Date(d.endDate) : null }),
        ...(d.noticePeriodMonths && { noticePeriodMonths: d.noticePeriodMonths }),
        ...(d.coldRent !== undefined && { coldRent: Number(d.coldRent), totalRent: Number(totalRent) }),
        ...(d.utilitiesAdvance !== undefined && { utilitiesAdvance: Number(d.utilitiesAdvance), totalRent: Number(totalRent) }),
        ...(d.depositAmount !== undefined && { depositAmount: Number(d.depositAmount) }),
        ...(d.depositReceivedDate !== undefined && { depositReceivedDate: d.depositReceivedDate ? new Date(d.depositReceivedDate) : null }),
        ...(d.notes !== undefined && { notes: d.notes }),
      },
      include: LEASE_INCLUDE,
    });

    return enrichLease(updated);
  }

  async recordDeposit(id: string, dto: RecordDepositDto, orgId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!lease) throw new NotFoundException('Lease not found');

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        depositReceivedDate: new Date(dto.receivedDate),
        ...(dto.notes && { depositNotes: dto.notes }),
      },
      include: LEASE_INCLUDE,
    });
    return enrichLease(updated);
  }

  async returnDeposit(id: string, dto: ReturnDepositDto, orgId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!lease) throw new NotFoundException('Lease not found');

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        depositReturnedDate: new Date(dto.returnedDate),
        ...(dto.notes && { depositNotes: dto.notes }),
      },
      include: LEASE_INCLUDE,
    });
    return enrichLease(updated);
  }

  async terminate(id: string, dto: TerminateLeaseDto, orgId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id, orgId } });
    if (!lease) throw new NotFoundException('Lease not found');
    if (lease.status === 'TERMINATED') {
      throw new BadRequestException('Lease is already terminated');
    }

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        status: 'TERMINATED',
        terminatedDate: new Date(dto.terminatedDate),
        terminationReason: dto.reason ?? null,
      },
      include: LEASE_INCLUDE,
    });
    return enrichLease(updated);
  }

  async getExpiringSoonCount(orgId: string) {
    const leases = await this.prisma.lease.findMany({
      where: { orgId, leaseType: 'FIXED_TERM', status: { in: ['ACTIVE', 'EXPIRING_SOON'] } },
    });
    return leases.filter((l: Lease) => {
      if (!l.endDate) return false;
      const days = differenceInDays(new Date(l.endDate), new Date());
      return days >= 0 && days <= 90;
    }).length;
  }
}
