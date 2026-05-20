"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma_service_1 = require("../../prisma/prisma.service");
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
let AppointmentsService = AppointmentsService_1 = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AppointmentsService_1.name);
    }
    async getTicketOrFail(ticketId, orgId) {
        const ticket = await this.prisma.ticket.findFirst({ where: { id: ticketId, orgId } });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return ticket;
    }
    async getAppointmentOrFail(id, orgId) {
        const appt = await this.prisma.appointment.findFirst({
            where: { id, orgId },
            include: APPOINTMENT_INCLUDE,
        });
        if (!appt)
            throw new common_1.NotFoundException('Appointment not found');
        return appt;
    }
    async createSystemMessage(orgId, ticketId, systemKey, systemData) {
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
    async cancelPendingReminders(appointmentId) {
        await this.prisma.notificationQueue.updateMany({
            where: {
                status: 'PENDING',
                payload: { path: ['appointmentId'], equals: appointmentId },
            },
            data: { status: 'CANCELLED' },
        });
    }
    async scheduleReminders(orgId, tenantId, appointmentId, ticketId, scheduledAt) {
        const now = new Date();
        const reminders = [
            { type: 'APPOINTMENT_REMINDER_24H', at: (0, date_fns_1.subHours)(scheduledAt, 24) },
            { type: 'APPOINTMENT_REMINDER_2H', at: (0, date_fns_1.subHours)(scheduledAt, 2) },
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
    async create(user, ticketId, dto) {
        if (user.role !== client_1.Role.LANDLORD)
            throw new common_1.ForbiddenException('Only landlords can schedule appointments');
        const ticket = await this.getTicketOrFail(ticketId, user.orgId);
        const scheduledAt = new Date(dto.scheduledAt);
        const minTime = (0, date_fns_1.addMinutes)(new Date(), MIN_FUTURE_MINUTES);
        if (scheduledAt <= minTime) {
            throw new common_1.BadRequestException('Appointment must be at least 30 minutes in the future');
        }
        const twoHoursBefore = (0, date_fns_1.subHours)(scheduledAt, 2);
        const twoHoursAfter = (0, date_fns_1.addMinutes)(scheduledAt, 120);
        const conflicting = await this.prisma.appointment.count({
            where: {
                orgId: user.orgId,
                status: client_1.AppointmentStatus.SCHEDULED,
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
        const dateLabel = (0, date_fns_1.format)(scheduledAt, 'dd.MM.yyyy HH:mm');
        await this.createSystemMessage(user.orgId, ticketId, 'appointment.scheduled', {
            date: (0, date_fns_1.format)(scheduledAt, 'dd.MM.yyyy'),
            time: (0, date_fns_1.format)(scheduledAt, 'HH:mm'),
            by: user.name ?? 'Landlord',
        });
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
    async findAll(user, dto) {
        const where = { orgId: user.orgId };
        if (user.role === client_1.Role.TENANT)
            where['ticket'] = { tenantId: user.sub };
        if (dto.status)
            where['status'] = dto.status;
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
    async findUpcoming(user) {
        const where = {
            orgId: user.orgId,
            status: client_1.AppointmentStatus.SCHEDULED,
            scheduledAt: { gte: new Date() },
        };
        if (user.role === client_1.Role.TENANT)
            where['ticket'] = { tenantId: user.sub };
        return this.prisma.appointment.findMany({
            where,
            include: APPOINTMENT_INCLUDE,
            orderBy: { scheduledAt: 'asc' },
            take: 10,
        });
    }
    async findOne(user, id) {
        const appt = await this.getAppointmentOrFail(id, user.orgId);
        if (user.role === client_1.Role.TENANT && appt.ticket.tenantId !== user.sub) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        return appt;
    }
    async update(user, id, dto) {
        if (user.role !== client_1.Role.LANDLORD)
            throw new common_1.ForbiddenException('Only landlords can edit appointments');
        const appt = await this.getAppointmentOrFail(id, user.orgId);
        if (appt.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Cannot edit a completed or cancelled appointment');
        }
        const oldDate = appt.scheduledAt;
        let newScheduledAt = appt.scheduledAt;
        if (dto.scheduledAt) {
            newScheduledAt = new Date(dto.scheduledAt);
            const minTime = (0, date_fns_1.addMinutes)(new Date(), MIN_FUTURE_MINUTES);
            if (newScheduledAt <= minTime) {
                throw new common_1.BadRequestException('Appointment must be at least 30 minutes in the future');
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
                oldDate: (0, date_fns_1.format)(oldDate, 'dd.MM.yyyy HH:mm'),
                newDate: (0, date_fns_1.format)(newScheduledAt, 'dd.MM.yyyy HH:mm'),
                by: user.name ?? 'Landlord',
            });
        }
        return updated;
    }
    async complete(user, id, dto) {
        if (user.role !== client_1.Role.LANDLORD)
            throw new common_1.ForbiddenException('Only landlords can complete appointments');
        const appt = await this.getAppointmentOrFail(id, user.orgId);
        if (appt.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Only scheduled appointments can be completed');
        }
        const updated = await this.prisma.appointment.update({
            where: { id },
            data: {
                status: client_1.AppointmentStatus.COMPLETED,
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
    async cancel(user, id, dto) {
        const appt = await this.getAppointmentOrFail(id, user.orgId);
        if (user.role === client_1.Role.TENANT && appt.ticket.tenantId !== user.sub) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (user.role !== client_1.Role.LANDLORD && user.role !== client_1.Role.TENANT) {
            throw new common_1.ForbiddenException('Unauthorized');
        }
        if (appt.status !== client_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Only scheduled appointments can be cancelled');
        }
        const updated = await this.prisma.appointment.update({
            where: { id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
                cancelReason: dto.reason ?? null,
            },
            include: APPOINTMENT_INCLUDE,
        });
        await this.cancelPendingReminders(id);
        const cancelledBy = user.role === client_1.Role.LANDLORD ? (user.name ?? 'Landlord') : 'Tenant';
        await this.createSystemMessage(user.orgId, appt.ticketId, 'appointment.cancelled', {
            by: cancelledBy,
            reason: dto.reason ?? '',
        });
        const otherUserId = user.role === client_1.Role.LANDLORD
            ? appt.ticket.tenantId
            : (await this.prisma.user.findFirst({ where: { orgId: user.orgId, role: client_1.Role.LANDLORD }, select: { id: true } }))?.id;
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = AppointmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map