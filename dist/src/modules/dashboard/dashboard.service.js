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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLandlordStats(orgId) {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const [totalProperties, totalUnits, occupiedUnits, pendingInvites, openTickets, inProgressTickets, emergencyTickets, upcomingVisits, recentProperties, recentTickets,] = await this.prisma.$transaction([
            this.prisma.property.count({ where: { orgId } }),
            this.prisma.unit.count({ where: { orgId } }),
            this.prisma.unit.count({ where: { orgId, tenantId: { not: null } } }),
            this.prisma.tenantInvite.count({
                where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
            }),
            this.prisma.ticket.count({ where: { orgId, status: 'OPEN' } }),
            this.prisma.ticket.count({ where: { orgId, status: 'IN_PROGRESS' } }),
            this.prisma.ticket.count({
                where: { orgId, isEmergency: true, status: { notIn: ['CLOSED'] } },
            }),
            this.prisma.landlordVisit.count({
                where: {
                    orgId,
                    status: 'SCHEDULED',
                    scheduledAt: { gte: now, lte: in7Days },
                },
            }),
            this.prisma.property.findMany({
                where: { orgId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { _count: { select: { units: true } } },
            }),
            this.prisma.ticket.findMany({
                where: { orgId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    tenant: { select: { id: true, name: true } },
                    unit: { select: { id: true, unitNumber: true } },
                },
            }),
        ]);
        const vacantUnits = totalUnits - occupiedUnits;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
        return {
            totalProperties,
            totalUnits,
            occupiedUnits,
            vacantUnits,
            occupancyRate,
            pendingInvites,
            openTickets,
            inProgressTickets,
            emergencyTickets,
            upcomingVisits,
            recentProperties,
            recentTickets,
        };
    }
    async getAdminStats() {
        const [totalOrgs, totalUsers, totalProperties, totalUnits] = await this.prisma.$transaction([
            this.prisma.organisation.count(),
            this.prisma.user.count(),
            this.prisma.property.count(),
            this.prisma.unit.count(),
        ]);
        return { totalOrgs, totalUsers, totalProperties, totalUnits };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map