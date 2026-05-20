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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
const BCRYPT_ROUNDS = 12;
const USER_SAFE_SELECT = {
    id: true, orgId: true, role: true, name: true,
    email: true, phone: true, language: true, isActive: true,
    emailVerified: true, createdAt: true, updatedAt: true,
};
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listOrgs(dto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 20;
        const skip = (page - 1) * limit;
        const where = dto.search
            ? { name: { contains: dto.search, mode: 'insensitive' } }
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
        const countByOrg = (rows) => rows.reduce((m, r) => m.set(r.orgId, (m.get(r.orgId) ?? 0) + 1), new Map());
        const [landlords, tenants, units] = await this.prisma.$transaction([
            this.prisma.user.findMany({ where: { orgId: { in: orgIds }, role: client_1.Role.LANDLORD }, select: { orgId: true } }),
            this.prisma.user.findMany({ where: { orgId: { in: orgIds }, role: client_1.Role.TENANT }, select: { orgId: true } }),
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
    async createOrg(dto) {
        const hashedPassword = await bcrypt.hash(dto.landlordPassword, BCRYPT_ROUNDS);
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUnique({ where: { email: dto.landlordEmail } });
            if (existing)
                throw new common_1.ConflictException('Email already registered');
            const organisation = await tx.organisation.create({
                data: { name: dto.orgName },
            });
            const user = await tx.user.create({
                data: {
                    orgId: organisation.id,
                    role: client_1.Role.LANDLORD,
                    name: dto.landlordName,
                    email: dto.landlordEmail,
                    password: hashedPassword,
                },
                select: USER_SAFE_SELECT,
            });
            return { organisation, user };
        });
    }
    async getOrg(id) {
        const org = await this.prisma.organisation.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, properties: true, tickets: true } },
            },
        });
        if (!org)
            throw new common_1.NotFoundException('Organisation not found');
        const [landlordCount, tenantCount, unitCount] = await this.prisma.$transaction([
            this.prisma.user.count({ where: { orgId: id, role: client_1.Role.LANDLORD } }),
            this.prisma.user.count({ where: { orgId: id, role: client_1.Role.TENANT } }),
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
    async updateOrg(id, dto) {
        await this.getOrg(id);
        return this.prisma.organisation.update({ where: { id }, data: { name: dto.name } });
    }
    async listOrgUsers(orgId) {
        await this.getOrg(orgId);
        return this.prisma.user.findMany({
            where: { orgId },
            select: USER_SAFE_SELECT,
            orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
        });
    }
    async addLandlord(orgId, dto) {
        await this.getOrg(orgId);
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.user.findUnique({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException('Email already registered');
            return tx.user.create({
                data: { orgId, role: client_1.Role.LANDLORD, name: dto.name, email: dto.email, password: hashedPassword },
                select: USER_SAFE_SELECT,
            });
        });
    }
    async deactivateUser(callerId, userId) {
        if (callerId === userId)
            throw new common_1.ForbiddenException('Cannot deactivate your own account');
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.isActive)
            throw new common_1.BadRequestException('User is already deactivated');
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false, refreshToken: null },
        });
        return { success: true };
    }
    async activateUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.isActive)
            throw new common_1.BadRequestException('User is already active');
        await this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
        return { success: true };
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [organisations, landlords, tenants, properties, units, totalTickets, openTickets, inProgressTickets, emergencies, emailsSentToday, failedNotifications,] = await this.prisma.$transaction([
            this.prisma.organisation.count(),
            this.prisma.user.count({ where: { role: client_1.Role.LANDLORD } }),
            this.prisma.user.count({ where: { role: client_1.Role.TENANT } }),
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
    async listQueue(dto) {
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map