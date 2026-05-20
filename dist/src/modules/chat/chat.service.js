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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const MESSAGE_INCLUDE = {
    sender: { select: { id: true, name: true } },
    reads: { select: { userId: true, readAt: true } },
};
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async verifyTicketAccess(user, ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, orgId: user.orgId },
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        if (user.role === client_1.Role.TENANT && ticket.tenantId !== user.sub) {
            throw new common_1.NotFoundException('Ticket not found');
        }
        return ticket;
    }
    async listMessages(user, ticketId, dto) {
        await this.verifyTicketAccess(user, ticketId);
        const limit = Math.min(dto.limit ?? 50, 50);
        const messages = await this.prisma.message.findMany({
            where: { ticketId, orgId: user.orgId },
            include: MESSAGE_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: limit + 1,
            ...(dto.cursor ? { cursor: { id: dto.cursor }, skip: 1 } : {}),
        });
        const hasMore = messages.length > limit;
        const data = hasMore ? messages.slice(0, limit) : messages;
        const nextCursor = hasMore ? data[data.length - 1].id : null;
        const toRead = data.filter((m) => m.senderId !== null && m.senderId !== user.sub);
        if (toRead.length > 0) {
            await this.prisma.messageRead.createMany({
                data: toRead.map((m) => ({ messageId: m.id, userId: user.sub })),
                skipDuplicates: true,
            });
        }
        return { data: data.reverse(), nextCursor, hasMore };
    }
    async sendMessage(user, ticketId, dto) {
        const ticket = await this.verifyTicketAccess(user, ticketId);
        if (dto.photo) {
            if (!dto.photo.startsWith('https://res.cloudinary.com/') ||
                !dto.photo.includes(`/propflow/${user.orgId}/chat/`)) {
                throw new common_1.BadRequestException('Invalid photo URL');
            }
        }
        const message = await this.prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
                data: {
                    orgId: user.orgId,
                    ticketId,
                    senderId: user.sub,
                    type: 'USER_MESSAGE',
                    content: dto.content,
                    photo: dto.photo ?? null,
                },
                include: MESSAGE_INCLUDE,
            });
            await tx.ticket.update({
                where: { id: ticketId },
                data: { lastActivity: new Date() },
            });
            return msg;
        });
        const targetUserId = user.role === client_1.Role.TENANT
            ? (await this.prisma.user.findFirst({ where: { orgId: user.orgId, role: client_1.Role.LANDLORD }, select: { id: true } }))?.id
            : ticket.tenantId;
        if (targetUserId) {
            await this.prisma.notificationQueue.create({
                data: {
                    orgId: user.orgId,
                    targetUserId,
                    type: 'MESSAGE_RECEIVED',
                    channels: ['PUSH', 'EMAIL'],
                    payload: {
                        ticketId,
                        messageId: message.id,
                        senderId: user.sub,
                        preview: dto.content.slice(0, 100),
                    },
                },
            });
        }
        this.logger.log(`Message sent in ticket ${ticketId} by ${user.sub}`);
        return message;
    }
    async markAllRead(user, ticketId) {
        await this.verifyTicketAccess(user, ticketId);
        const unread = await this.prisma.message.findMany({
            where: {
                ticketId,
                orgId: user.orgId,
                senderId: { not: user.sub },
                type: 'USER_MESSAGE',
                reads: { none: { userId: user.sub } },
            },
            select: { id: true },
        });
        if (unread.length > 0) {
            await this.prisma.messageRead.createMany({
                data: unread.map((m) => ({ messageId: m.id, userId: user.sub })),
                skipDuplicates: true,
            });
        }
        return { markedCount: unread.length };
    }
    async getUnreadCount(user) {
        const where = {
            orgId: user.orgId,
            type: 'USER_MESSAGE',
            senderId: { not: user.sub },
            reads: { none: { userId: user.sub } },
            ...(user.role === client_1.Role.TENANT ? { ticket: { tenantId: user.sub } } : {}),
        };
        const messages = await this.prisma.message.findMany({
            where,
            select: { id: true, ticketId: true },
        });
        const byTicket = {};
        for (const msg of messages) {
            byTicket[msg.ticketId] = (byTicket[msg.ticketId] ?? 0) + 1;
        }
        return { count: messages.length, byTicket };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map