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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const webpush = require("web-push");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const notification_types_1 = require("./notification-types");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, mail, config) {
        this.prisma = prisma;
        this.mail = mail;
        this.config = config;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.frontendUrl = this.config.get('FRONTEND_URL') ?? 'http://localhost:3000';
        const publicKey = this.config.get('VAPID_PUBLIC_KEY');
        const privateKey = this.config.get('VAPID_PRIVATE_KEY');
        const email = this.config.get('VAPID_EMAIL');
        if (publicKey && privateKey && email) {
            webpush.setVapidDetails(email, publicKey, privateKey);
            this.vapidConfigured = true;
        }
        else {
            this.logger.warn('VAPID keys not configured — push notifications disabled');
            this.vapidConfigured = false;
        }
    }
    async processEntry(entry) {
        const user = await this.prisma.user.findUnique({
            where: { id: entry.targetUserId },
            select: { id: true, email: true, name: true, language: true, pushSubscription: true },
        });
        if (!user) {
            this.logger.warn(`Target user ${entry.targetUserId} not found — skipping`);
            return;
        }
        const payload = entry.payload;
        const meta = notification_types_1.NOTIFICATION_TYPES[entry.type];
        const lang = user.language ?? 'de';
        const link = meta
            ? (0, notification_types_1.resolveLink)(meta.linkPattern, { ticketId: payload.ticketId ?? '' })
            : '/';
        for (const channel of entry.channels) {
            if (channel === 'EMAIL')
                await this.sendEmail(user, entry.type, payload, lang);
            if (channel === 'PUSH')
                await this.sendPush(user, entry.type, lang, link);
        }
        await this.createInApp(entry.targetUserId, entry.orgId, entry.type, payload, lang, link);
    }
    async sendEmail(user, type, payload, lang) {
        const ticketLink = `${this.frontendUrl}${payload.ticketId ? `/landlord/tickets/${payload.ticketId}` : ''}`;
        switch (type) {
            case 'TICKET_CREATED':
                await this.mail.sendTicketCreated({
                    to: user.email,
                    language: lang,
                    tenantName: payload.tenantName ?? user.name,
                    unitNumber: payload.unitNumber ?? '',
                    propertyName: payload.propertyName ?? '',
                    ticketTitle: payload.ticketTitle ?? '',
                    ticketCategory: payload.ticketCategory ?? '',
                    ticketPriority: payload.ticketPriority ?? 'NORMAL',
                    description: payload.ticketDescription ?? '',
                    ticketLink,
                });
                break;
            case 'MESSAGE_RECEIVED':
                await this.mail.sendMessageReceived({
                    to: user.email,
                    language: lang,
                    senderName: payload.senderName ?? '',
                    messagePreview: payload.messagePreview ?? '',
                    ticketTitle: payload.ticketTitle ?? '',
                    ticketLink,
                });
                break;
            case 'APPOINTMENT_SCHEDULED':
            case 'APPOINTMENT_RESCHEDULED':
                await this.mail.sendAppointmentScheduled({
                    to: user.email,
                    language: lang,
                    ticketTitle: payload.ticketTitle ?? '',
                    scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
                    durationMin: payload.durationMin ?? 60,
                    address: payload.address ?? '',
                    note: payload.note,
                    ticketLink,
                });
                break;
            case 'APPOINTMENT_REMINDER_24H':
            case 'APPOINTMENT_REMINDER_2H':
                await this.mail.sendAppointmentReminder({
                    to: user.email,
                    language: lang,
                    ticketTitle: payload.ticketTitle ?? '',
                    scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
                    address: payload.address ?? '',
                    hoursUntil: payload.hoursUntil ?? 24,
                    ticketLink,
                });
                break;
            case 'APPOINTMENT_CANCELLED':
                await this.mail.sendAppointmentCancelled({
                    to: user.email,
                    language: lang,
                    ticketTitle: payload.ticketTitle ?? '',
                    scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
                    cancelledBy: payload.cancelledBy ?? '',
                    reason: payload.cancelReason,
                    ticketLink,
                });
                break;
            case 'TICKET_PENDING_REMINDER':
                await this.mail.sendTicketPendingReminder({
                    to: user.email,
                    language: lang,
                    ticketTitle: payload.ticketTitle ?? '',
                    ticketNumber: payload.ticketNumber ?? '',
                    daysOpen: payload.daysOpen ?? 3,
                    tenantName: payload.tenantName ?? '',
                    unitNumber: payload.unitNumber ?? '',
                    ticketLink,
                });
                break;
            case 'VISIT_SCHEDULED': {
                const calendarLink = `${this.frontendUrl}/tenant/calendar`;
                await this.mail.sendVisitScheduled({
                    to: user.email,
                    language: lang,
                    landlordName: payload.landlordName ?? '',
                    propertyName: payload.propertyName ?? '',
                    unitNumber: payload.unitNumber ?? '',
                    scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
                    durationMin: payload.durationMin ?? 60,
                    reason: payload.reason ?? '',
                    note: payload.note,
                    calendarLink,
                });
                break;
            }
            default:
                this.logger.warn(`No email handler for type: ${type}`);
        }
    }
    async sendPush(user, type, lang, link) {
        if (!this.vapidConfigured || !user.pushSubscription)
            return;
        const meta = notification_types_1.NOTIFICATION_TYPES[type];
        if (!meta || !meta.pushTitle)
            return;
        const isDE = lang === 'de';
        const pushData = {
            title: isDE ? meta.pushTitle.de : meta.pushTitle.en,
            body: isDE ? meta.inAppBody.de : meta.inAppBody.en,
            url: `${this.frontendUrl}${link}`,
            icon: '/icon-192x192.png',
        };
        try {
            const sub = JSON.parse(user.pushSubscription);
            await webpush.sendNotification(sub, JSON.stringify(pushData));
        }
        catch (err) {
            const webErr = err;
            if (webErr.statusCode === 410) {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { pushSubscription: null },
                });
                this.logger.log(`Push subscription removed for user ${user.id} (410 Gone)`);
            }
            else {
                throw err;
            }
        }
    }
    async createInApp(userId, orgId, type, payload, lang, link) {
        const meta = notification_types_1.NOTIFICATION_TYPES[type];
        if (!meta)
            return;
        const isDE = lang === 'de';
        await this.prisma.inAppNotification.create({
            data: {
                orgId,
                userId,
                type,
                title: isDE ? meta.inAppTitle.de : meta.inAppTitle.en,
                body: isDE ? meta.inAppBody.de : meta.inAppBody.en,
                link,
                payload: payload,
            },
        });
    }
    async savePushSubscription(userId, subscription) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushSubscription: JSON.stringify(subscription) },
        });
    }
    async removePushSubscription(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushSubscription: null },
        });
    }
    async listInApp(userId, dto) {
        return this.prisma.inAppNotification.findMany({
            where: {
                userId,
                ...(dto.unreadOnly ? { isRead: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: dto.limit ?? 20,
        });
    }
    async markRead(userId, id) {
        return this.prisma.inAppNotification.update({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    async markAllRead(userId) {
        const result = await this.prisma.inAppNotification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        return { count: result.count };
    }
    async getUnreadCount(userId) {
        const count = await this.prisma.inAppNotification.count({
            where: { userId, isRead: false },
        });
        return { count };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map