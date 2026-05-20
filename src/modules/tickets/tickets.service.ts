import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Role, TicketStatus } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';

const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CLOSED'],
  IN_PROGRESS: ['FIXED', 'OPEN', 'CLOSED'],
  FIXED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

const TICKET_INCLUDE = {
  tenant: { select: { id: true, name: true, email: true, phone: true } },
  unit: {
    select: {
      id: true,
      unitNumber: true,
      property: { select: { id: true, name: true, street: true, city: true } },
    },
  },
  statusHistory: { orderBy: { changedAt: 'asc' as const } },
  appointments: {
    orderBy: { scheduledAt: 'asc' as const },
    include: { createdBy: { select: { id: true, name: true } } },
  },
};

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}


  private validatePhotoUrls(orgId: string, photos: string[]) {
    for (const url of photos) {
      if (
        !url.startsWith('https://res.cloudinary.com/') ||
        !url.includes(`/propflow/${orgId}/tickets/`)
      ) {
        throw new BadRequestException(`Invalid photo URL: ${url}`);
      }
    }
  }

  async create(user: JwtPayload, dto: CreateTicketDto) {
    if (user.role !== Role.TENANT) throw new ForbiddenException('Only tenants can create tickets');
    if (dto.isEmergency && !dto.emergencyType) {
      throw new BadRequestException('emergencyType is required when isEmergency is true');
    }

    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, orgId: user.orgId, tenantId: user.sub },
    });
    if (!unit) throw new ForbiddenException('Unit not found or not assigned to you');

    const photos = dto.photos ?? [];
    if (photos.length > 0) this.validatePhotoUrls(user.orgId, photos);

    const ticket = await this.prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const counter = await tx.ticketCounter.upsert({
        where: { year },
        update: { count: { increment: 1 } },
        create: { year, count: 1 },
      });
      const ticketNumber = `T-${year}-${String(counter.count).padStart(4, '0')}`;

      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          orgId: user.orgId,
          unitId: dto.unitId,
          tenantId: user.sub,
          category: dto.category,
          priority: dto.priority,
          title: dto.title,
          description: dto.description,
          photos,
          isEmergency: dto.isEmergency,
          emergencyType: dto.emergencyType ?? null,
          statusHistory: {
            create: { fromStatus: null, toStatus: 'OPEN', changedBy: user.sub },
          },
        },
        include: TICKET_INCLUDE,
      });

      await tx.message.create({
        data: {
          orgId: user.orgId,
          ticketId: ticket.id,
          type: 'SYSTEM_MESSAGE',
          content: 'Ticket created',
          systemKey: 'ticket.created',
          systemData: { ticketNumber },
        },
      });

      return ticket;
    });

    // Enqueue notification for landlord
    const landlord = await this.prisma.user.findFirst({
      where: { orgId: user.orgId, role: Role.LANDLORD },
    });
    if (landlord) {
      await this.prisma.notificationQueue.create({
        data: {
          orgId: user.orgId,
          targetUserId: landlord.id,
          type: 'TICKET_CREATED',
          channels: dto.isEmergency ? ['EMAIL', 'PUSH'] : ['EMAIL'],
          payload: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, isEmergency: dto.isEmergency },
        },
      });
    }

    this.logger.log(`Ticket ${ticket.ticketNumber} created by tenant ${user.sub}`);
    return ticket;
  }

  async findAll(user: JwtPayload, dto: ListTicketsDto) {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { orgId: user.orgId };
    if (user.role === Role.TENANT) where['tenantId'] = user.sub;
    if (dto.status) where['status'] = dto.status;
    if (dto.priority) where['priority'] = dto.priority;
    if (dto.category) where['category'] = dto.category;
    if (dto.isEmergency !== undefined) where['isEmergency'] = dto.isEmergency;
    if (dto.propertyId && user.role === Role.LANDLORD) {
      where['unit'] = { propertyId: dto.propertyId };
    }
    if (dto.search) {
      where['OR'] = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveOrderBy(dto.sort);

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({ where, orderBy, skip, take: limit, include: TICKET_INCLUDE }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private resolveOrderBy(sort?: string) {
    switch (sort) {
      case 'oldest': return { createdAt: 'asc' as const };
      case 'priority': return { priority: 'asc' as const };
      case 'last_activity': return { lastActivity: 'desc' as const };
      default: return { createdAt: 'desc' as const };
    }
  }

  async findOne(user: JwtPayload, id: string) {
    const where: Record<string, unknown> = { id, orgId: user.orgId };
    if (user.role === Role.TENANT) where['tenantId'] = user.sub;

    const ticket = await this.prisma.ticket.findFirst({
      where,
      include: {
        ...TICKET_INCLUDE,
        notes: user.role === Role.LANDLORD
          ? { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'asc' as const } }
          : false,
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async updateStatus(user: JwtPayload, id: string, dto: UpdateTicketStatusDto) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can update status');

    const ticket = await this.prisma.ticket.findFirst({ where: { id, orgId: user.orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const allowed = ALLOWED_TRANSITIONS[ticket.status];
    if (!allowed.includes(dto.status)) {
      throw new UnprocessableEntityException(
        `Cannot transition from ${ticket.status} to ${dto.status}`,
      );
    }

    const byName = user.name;
    const closedAt = dto.status === 'CLOSED' ? new Date() : ticket.closedAt;
    const fromStatus = ticket.status;

    const [updated] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id },
        data: { status: dto.status, lastActivity: new Date(), closedAt },
        include: TICKET_INCLUDE,
      }),
      this.prisma.ticketStatusLog.create({
        data: { ticketId: id, fromStatus, toStatus: dto.status, changedBy: user.sub },
      }),
      this.prisma.message.create({
        data: {
          orgId: user.orgId,
          ticketId: id,
          type: 'SYSTEM_MESSAGE',
          content: `Status changed from ${fromStatus} to ${dto.status}`,
          systemKey: 'status.changed',
          systemData: { from: fromStatus, to: dto.status, by: byName },
        },
      }),
    ]);

    this.logger.log(`Ticket ${id} status changed to ${dto.status} by ${user.sub}`);
    return updated;
  }

  async createNote(user: JwtPayload, ticketId: string, dto: CreateNoteDto) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can add notes');

    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId: user.orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticketNote.create({
      data: { ticketId, authorId: user.sub, content: dto.content },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async findNotes(user: JwtPayload, ticketId: string) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can view notes');

    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId: user.orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticketNote.findMany({
      where: { ticketId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findUnitHistory(user: JwtPayload, unitId: string) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can view unit history');

    const unit = await this.prisma.unit.findFirst({ where: { id: unitId, orgId: user.orgId } });
    if (!unit) throw new NotFoundException('Unit not found');

    return this.prisma.ticket.findMany({
      where: { unitId, orgId: user.orgId },
      include: TICKET_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }
}
