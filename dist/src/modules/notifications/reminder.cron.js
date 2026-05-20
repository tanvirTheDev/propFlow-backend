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
var ReminderCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const date_fns_1 = require("date-fns");
const prisma_service_1 = require("../../prisma/prisma.service");
const PENDING_DAYS_THRESHOLD = 3;
let ReminderCron = ReminderCron_1 = class ReminderCron {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReminderCron_1.name);
    }
    async checkPendingTickets() {
        const threshold = (0, date_fns_1.subDays)(new Date(), PENDING_DAYS_THRESHOLD);
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
        if (staleTickets.length === 0)
            return;
        this.logger.log(`Found ${staleTickets.length} stale ticket(s) to remind`);
        for (const ticket of staleTickets) {
            const existing = await this.prisma.notificationQueue.findFirst({
                where: {
                    orgId: ticket.orgId,
                    type: 'TICKET_PENDING_REMINDER',
                    payload: { path: ['ticketId'], equals: ticket.id },
                    createdAt: { gte: (0, date_fns_1.subDays)(new Date(), 1) },
                },
            });
            if (existing)
                continue;
            const landlord = await this.prisma.user.findFirst({
                where: { orgId: ticket.orgId, role: 'LANDLORD' },
                select: { id: true },
            });
            if (!landlord)
                continue;
            const daysOpen = Math.floor((Date.now() - ticket.updatedAt.getTime()) / (1000 * 60 * 60 * 24));
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
};
exports.ReminderCron = ReminderCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReminderCron.prototype, "checkPendingTickets", null);
exports.ReminderCron = ReminderCron = ReminderCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReminderCron);
//# sourceMappingURL=reminder.cron.js.map