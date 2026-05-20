import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { subHours, addMinutes, format } from 'date-fns';
import { PrismaService } from '@/prisma/prisma.service';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

const APPOINTMENT_INCLUDE = {
  createdBy: { select: { id: true, name: true } },
  ticket: {
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      priority: true,
      tenantId: true,
      unit: {
        select: {
          id: true,
          unitNumber: true,
          property: { select: { id: true, name: true, street: true, city: true } },
        },
      },
    },
  },
};

const MIN_FUTURE_MINUTES = 30;

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getTicketOrFail(ticketId: string, orgId: string) {
    const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private async getAppointmentOrFail(id: string, orgId: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, orgId },
      include: APPOINTMENT_INCLUDE,
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  private async createSystemMessage(orgId: string, ticketId: string, systemKey: string, systemData: Record<string, string>) {
    await this.prisma.message.create({
      data: {
        orgId,
        ticketId,
        type: 'SYSTEM_MESSAGE',
        content: systemKey,
        systemKey,
        systemData,
      },
    });
  }

  private async cancelPendingReminders(appointmentId: string) {
    await this.prisma.notificationQueue.updateMany({
      where: {
        status: 'PENDING',
        payload: { path: ['appointmentId'], equals: appointmentId },
      },
      data: { status: 'CANCELLED' },
    });
  }

  private async scheduleReminders(orgId: string, tenantId: string, appointmentId: string, ticketId: string, scheduledAt: Date) {
    const now = new Date();
    const reminders = [
      { type: 'APPOINTMENT_REMINDER_24H', at: subHours(scheduledAt, 24) },
      { type: 'APPOINTMENT_REMINDER_2H', at: subHours(scheduledAt, 2) },
    ].filter((r) => r.at > now);

    for (const reminder of reminders) {
      await this.prisma.notificationQueue.create({
        data: {
          orgId,
          targetUserId: tenantId,
          type: reminder.type,
          channels: ['EMAIL', 'PUSH'],
          payload: { appointmentId, ticketId },
          scheduledAt: reminder.at,
        },
      });
    }
  }

  async create(user: JwtPayload, ticketId: string, dto: CreateAppointmentDto) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can schedule appointments');

    const ticket = await this.getTicketOrFail(ticketId, user.orgId);

    const scheduledAt = new Date(dto.scheduledAt);
    const minTime = addMinutes(new Date(), MIN_FUTURE_MINUTES);
    if (scheduledAt <= minTime) {
      throw new BadRequestException('Appointment must be at least 30 minutes in the future');
    }

    // Soft conflict detection: another appointment within 2 hours in org
    const twoHoursBefore = subHours(scheduledAt, 2);
    const twoHoursAfter = addMinutes(scheduledAt, 120);
    const conflicting = await this.prisma.appointment.count({
      where: {
        orgId: user.orgId,
        status: AppointmentStatus.SCHEDULED,
        scheduledAt: { gte: twoHoursBefore, lte: twoHoursAfter },
      },
    });

    const appointment = await this.prisma.appointment.create({
      data: {
        orgId: user.orgId,
        ticketId,
        createdById: user.sub,
        scheduledAt,
        durationMin: dto.durationMin ?? 60,
        note: dto.note ?? null,
      },
      include: APPOINTMENT_INCLUDE,
    });

    const dateLabel = format(scheduledAt, 'dd.MM.yyyy HH:mm');
    await this.createSystemMessage(user.orgId, ticketId, 'appointment.scheduled', {
      date: format(scheduledAt, 'dd.MM.yyyy'),
      time: format(scheduledAt, 'HH:mm'),
      by: user.name ?? 'Landlord',
    });

    // Notify tenant immediately
    await this.prisma.notificationQueue.create({
      data: {
        orgId: user.orgId,
        targetUserId: ticket.tenantId,
        type: 'APPOINTMENT_SCHEDULED',
        channels: ['EMAIL', 'PUSH'],
        payload: { appointmentId: appointment.id, ticketId, date: dateLabel },
      },
    });

    await this.scheduleReminders(user.orgId, ticket.tenantId, appointment.id, ticketId, scheduledAt);

    this.logger.log(`Appointment ${appointment.id} created for ticket ${ticketId}`);
    return { appointment, warnings: conflicting > 0 ? ['Landlord has another appointment near this time'] : [] };
  }

  async findAll(user: JwtPayload, dto: ListAppointmentsDto) {
    const where: Record<string, unknown> = { orgId: user.orgId };
    if (user.role === Role.TENANT) where['ticket'] = { tenantId: user.sub };
    if (dto.status) where['status'] = dto.status;
    if (dto.from || dto.to) {
      where['scheduledAt'] = {
        ...(dto.from ? { gte: new Date(dto.from) } : {}),
        ...(dto.to ? { lte: new Date(dto.to) } : {}),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findUpcoming(user: JwtPayload) {
    const where: Record<string, unknown> = {
      orgId: user.orgId,
      status: AppointmentStatus.SCHEDULED,
      scheduledAt: { gte: new Date() },
    };
    if (user.role === Role.TENANT) where['ticket'] = { tenantId: user.sub };

    return this.prisma.appointment.findMany({
      where,
      include: APPOINTMENT_INCLUDE,
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });
  }

  async findOne(user: JwtPayload, id: string) {
    const appt = await this.getAppointmentOrFail(id, user.orgId);
    if (user.role === Role.TENANT && appt.ticket.tenantId !== user.sub) {
      throw new NotFoundException('Appointment not found');
    }
    return appt;
  }

  async update(user: JwtPayload, id: string, dto: UpdateAppointmentDto) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can edit appointments');

    const appt = await this.getAppointmentOrFail(id, user.orgId);
    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Cannot edit a completed or cancelled appointment');
    }

    const oldDate = appt.scheduledAt;
    let newScheduledAt = appt.scheduledAt;

    if (dto.scheduledAt) {
      newScheduledAt = new Date(dto.scheduledAt);
      const minTime = addMinutes(new Date(), MIN_FUTURE_MINUTES);
      if (newScheduledAt <= minTime) {
        throw new BadRequestException('Appointment must be at least 30 minutes in the future');
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt ? { scheduledAt: newScheduledAt } : {}),
        ...(dto.durationMin ? { durationMin: dto.durationMin } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
      },
      include: APPOINTMENT_INCLUDE,
    });

    if (dto.scheduledAt) {
      await this.cancelPendingReminders(id);
      await this.scheduleReminders(user.orgId, appt.ticket.tenantId, id, appt.ticketId, newScheduledAt);

      await this.createSystemMessage(user.orgId, appt.ticketId, 'appointment.rescheduled', {
        oldDate: format(oldDate, 'dd.MM.yyyy HH:mm'),
        newDate: format(newScheduledAt, 'dd.MM.yyyy HH:mm'),
        by: user.name ?? 'Landlord',
      });
    }

    return updated;
  }

  async complete(user: JwtPayload, id: string, dto: CompleteAppointmentDto) {
    if (user.role !== Role.LANDLORD) throw new ForbiddenException('Only landlords can complete appointments');

    const appt = await this.getAppointmentOrFail(id, user.orgId);
    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be completed');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
        ...(dto.note ? { note: dto.note } : {}),
      },
      include: APPOINTMENT_INCLUDE,
    });

    await this.cancelPendingReminders(id);
    await this.createSystemMessage(user.orgId, appt.ticketId, 'appointment.completed', {
      by: user.name ?? 'Landlord',
    });

    return updated;
  }

  async cancel(user: JwtPayload, id: string, dto: CancelAppointmentDto) {
    const appt = await this.getAppointmentOrFail(id, user.orgId);

    if (user.role === Role.TENANT && appt.ticket.tenantId !== user.sub) {
      throw new NotFoundException('Appointment not found');
    }
    if (user.role !== Role.LANDLORD && user.role !== Role.TENANT) {
      throw new ForbiddenException('Unauthorized');
    }

    if (appt.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled appointments can be cancelled');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: dto.reason ?? null,
      },
      include: APPOINTMENT_INCLUDE,
    });

    await this.cancelPendingReminders(id);

    const cancelledBy = user.role === Role.LANDLORD ? (user.name ?? 'Landlord') : 'Tenant';
    await this.createSystemMessage(user.orgId, appt.ticketId, 'appointment.cancelled', {
      by: cancelledBy,
      reason: dto.reason ?? '',
    });

    // Notify the other party
    const otherUserId = user.role === Role.LANDLORD
      ? appt.ticket.tenantId
      : (await this.prisma.user.findFirst({ where: { orgId: user.orgId, role: Role.LANDLORD }, select: { id: true } }))?.id;

    if (otherUserId) {
      await this.prisma.notificationQueue.create({
        data: {
          orgId: user.orgId,
          targetUserId: otherUserId,
          type: 'APPOINTMENT_CANCELLED',
          channels: ['EMAIL', 'PUSH'],
          payload: { appointmentId: id, ticketId: appt.ticketId },
        },
      });
    }

    return updated;
  }
}
