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
var VisitsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const prisma_service_1 = require("../../prisma/prisma.service");
const VISIT_INCLUDE = {
    property: { select: { id: true, name: true, street: true, city: true, postalCode: true } },
    createdBy: { select: { id: true, name: true } },
    units: {
        include: {
            unit: { select: { id: true, unitNumber: true } },
            tenant: { select: { id: true, name: true, email: true, language: true } },
        },
    },
};
let VisitsService = VisitsService_1 = class VisitsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(VisitsService_1.name);
    }
    async create(orgId, userId, dto) {
        const property = await this.prisma.property.findFirst({
            where: { id: dto.propertyId, orgId },
            include: { units: { select: { id: true, tenantId: true } } },
        });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        const propertyUnitIds = property.units.map((u) => u.id);
        const invalidUnits = dto.units.filter((u) => !propertyUnitIds.includes(u.unitId));
        if (invalidUnits.length) {
            throw new common_1.BadRequestException('Some units do not belong to this property');
        }
        if (new Date(dto.scheduledAt) <= new Date()) {
            throw new common_1.UnprocessableEntityException('Visit must be scheduled in the future');
        }
        const hoursUntil = (0, date_fns_1.differenceInHours)(new Date(dto.scheduledAt), new Date());
        const warning = hoursUntil < 24 ? '24h_notice' : undefined;
        const createdBy = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { id: true, name: true },
        });
        const visit = await this.prisma.$transaction(async (tx) => {
            const created = await tx.landlordVisit.create({
                data: {
                    orgId,
                    propertyId: dto.propertyId,
                    createdById: userId,
                    scheduledAt: new Date(dto.scheduledAt),
                    durationMin: dto.durationMin ?? 60,
                    reason: dto.reason,
                    note: dto.note,
                    units: {
                        create: dto.units.map((u) => ({
                            unitId: u.unitId,
                            notifyTenant: u.notifyTenant,
                            tenantId: property.units.find((pu) => pu.id === u.unitId)?.tenantId ?? null,
                        })),
                    },
                },
                include: VISIT_INCLUDE,
            });
            return created;
        });
        await this.enqueueVisitNotifications(orgId, visit, createdBy.name);
        this.logger.log(`Visit ${visit.id} created for org ${orgId}`);
        return { visit, warning };
    }
    async findAll(orgId, userId, role, query) {
        const { from, to, status, propertyId } = query;
        if (role === client_1.Role.TENANT) {
            const myUnit = await this.prisma.unit.findFirst({
                where: { tenantId: userId },
                select: { id: true },
            });
            if (!myUnit)
                return [];
            return this.prisma.landlordVisit.findMany({
                where: {
                    orgId,
                    ...(status && { status }),
                    ...(from && { scheduledAt: { gte: new Date(from) } }),
                    ...(to && { scheduledAt: { lte: new Date(to) } }),
                    units: { some: { unitId: myUnit.id } },
                },
                include: VISIT_INCLUDE,
                orderBy: { scheduledAt: 'asc' },
            });
        }
        return this.prisma.landlordVisit.findMany({
            where: {
                orgId,
                ...(status && { status }),
                ...(propertyId && { propertyId }),
                ...(from && { scheduledAt: { gte: new Date(from) } }),
                ...(to && { scheduledAt: { lte: new Date(to) } }),
            },
            include: VISIT_INCLUDE,
            orderBy: { scheduledAt: 'asc' },
        });
    }
    async findOne(id, orgId, userId, role) {
        const visit = await this.prisma.landlordVisit.findFirst({
            where: { id, orgId },
            include: VISIT_INCLUDE,
        });
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        if (role === client_1.Role.TENANT) {
            const myUnit = await this.prisma.unit.findFirst({
                where: { tenantId: userId },
                select: { id: true },
            });
            const hasAccess = visit.units.some((u) => u.unitId === myUnit?.id);
            if (!hasAccess)
                throw new common_1.NotFoundException('Visit not found');
        }
        return visit;
    }
    async update(id, orgId, userId, dto) {
        const visit = await this.prisma.landlordVisit.findFirst({
            where: { id, orgId },
            include: { property: { include: { units: { select: { id: true, tenantId: true } } } } },
        });
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        if (visit.status !== client_1.VisitStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Cannot edit a completed or cancelled visit');
        }
        if (dto.units) {
            const propertyUnitIds = visit.property.units.map((u) => u.id);
            const invalid = dto.units.filter((u) => !propertyUnitIds.includes(u.unitId));
            if (invalid.length)
                throw new common_1.BadRequestException('Some units do not belong to this property');
        }
        const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : visit.scheduledAt;
        if (scheduledAt <= new Date()) {
            throw new common_1.UnprocessableEntityException('Visit must be scheduled in the future');
        }
        const hoursUntil = (0, date_fns_1.differenceInHours)(scheduledAt, new Date());
        const warning = hoursUntil < 24 ? '24h_notice' : undefined;
        const shouldReNotify = dto.scheduledAt !== undefined || dto.units !== undefined;
        const updated = await this.prisma.$transaction(async (tx) => {
            if (dto.units) {
                await tx.landlordVisitUnit.deleteMany({ where: { visitId: id } });
                await tx.landlordVisitUnit.createMany({
                    data: dto.units.map((u) => ({
                        visitId: id,
                        unitId: u.unitId,
                        notifyTenant: u.notifyTenant,
                        tenantId: visit.property.units.find((pu) => pu.id === u.unitId)?.tenantId ?? null,
                    })),
                });
            }
            return tx.landlordVisit.update({
                where: { id },
                data: {
                    ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
                    ...(dto.durationMin && { durationMin: dto.durationMin }),
                    ...(dto.reason && { reason: dto.reason }),
                    ...(dto.note !== undefined && { note: dto.note }),
                },
                include: VISIT_INCLUDE,
            });
        });
        if (shouldReNotify) {
            await this.prisma.notificationQueue.updateMany({
                where: {
                    orgId,
                    status: 'PENDING',
                    type: 'VISIT_SCHEDULED',
                    payload: { path: ['visitId'], equals: id },
                },
                data: { status: 'CANCELLED' },
            });
            const creator = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true },
            });
            await this.enqueueVisitNotifications(orgId, updated, creator?.name ?? '');
        }
        return { visit: updated, warning };
    }
    async complete(id, orgId, note) {
        const visit = await this.prisma.landlordVisit.findFirst({ where: { id, orgId } });
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        if (visit.status !== client_1.VisitStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Visit is not in SCHEDULED status');
        }
        return this.prisma.landlordVisit.update({
            where: { id },
            data: {
                status: client_1.VisitStatus.COMPLETED,
                completedAt: new Date(),
                ...(note && { note }),
            },
            include: VISIT_INCLUDE,
        });
    }
    async cancel(id, orgId, reason) {
        const visit = await this.prisma.landlordVisit.findFirst({ where: { id, orgId } });
        if (!visit)
            throw new common_1.NotFoundException('Visit not found');
        if (visit.status !== client_1.VisitStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Visit is not in SCHEDULED status');
        }
        await this.prisma.notificationQueue.updateMany({
            where: {
                orgId,
                status: 'PENDING',
                type: 'VISIT_SCHEDULED',
                payload: { path: ['visitId'], equals: id },
            },
            data: { status: 'CANCELLED' },
        });
        return this.prisma.landlordVisit.update({
            where: { id },
            data: {
                status: client_1.VisitStatus.CANCELLED,
                ...(reason && { cancelReason: reason }),
            },
            include: VISIT_INCLUDE,
        });
    }
    async enqueueVisitNotifications(orgId, visit, landlordName) {
        for (const visitUnit of visit.units) {
            if (!visitUnit.notifyTenant || !visitUnit.tenantId)
                continue;
            await this.prisma.notificationQueue.create({
                data: {
                    orgId,
                    targetUserId: visitUnit.tenantId,
                    type: 'VISIT_SCHEDULED',
                    channels: ['EMAIL'],
                    payload: {
                        visitId: visit.id,
                        propertyName: visit.property.name,
                        unitId: visitUnit.unitId,
                        unitNumber: visitUnit.unit?.unitNumber ?? '',
                        scheduledAt: visit.scheduledAt.toISOString(),
                        durationMin: visit.durationMin,
                        reason: visit.reason,
                        note: visit.note ?? null,
                        landlordName,
                    },
                    scheduledAt: new Date(),
                },
            });
        }
    }
};
exports.VisitsService = VisitsService;
exports.VisitsService = VisitsService = VisitsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VisitsService);
//# sourceMappingURL=visits.service.js.map