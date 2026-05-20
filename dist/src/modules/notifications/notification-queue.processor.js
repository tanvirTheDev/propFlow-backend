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
var NotificationQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationQueueProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
const notifications_service_1 = require("./notifications.service");
let NotificationQueueProcessor = NotificationQueueProcessor_1 = class NotificationQueueProcessor {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.logger = new common_1.Logger(NotificationQueueProcessor_1.name);
    }
    async processQueue() {
        await this.prisma.notificationQueue.updateMany({
            where: { status: 'PROCESSING' },
            data: { status: 'PENDING' },
        });
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
            if (pending.length === 0)
                return [];
            await tx.notificationQueue.updateMany({
                where: { id: { in: pending.map((e) => e.id) } },
                data: { status: 'PROCESSING' },
            });
            return pending;
        });
        if (entries.length === 0)
            return;
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
            }
            catch (err) {
                this.logger.error(`Notification ${entry.id} failed: ${err.message}`);
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
};
exports.NotificationQueueProcessor = NotificationQueueProcessor;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationQueueProcessor.prototype, "processQueue", null);
exports.NotificationQueueProcessor = NotificationQueueProcessor = NotificationQueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], NotificationQueueProcessor);
//# sourceMappingURL=notification-queue.processor.js.map