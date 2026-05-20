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
var UnitsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let UnitsService = UnitsService_1 = class UnitsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(UnitsService_1.name);
    }
    async findAllByProperty(propertyId, orgId) {
        const property = await this.prisma.property.findFirst({ where: { id: propertyId, orgId } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        return this.prisma.unit.findMany({
            where: { propertyId, orgId },
            include: {
                tenant: { select: { id: true, name: true, email: true } },
            },
            orderBy: { unitNumber: 'asc' },
        });
    }
    async findOne(id, orgId) {
        const unit = await this.prisma.unit.findFirst({
            where: { id, orgId },
            include: {
                property: { select: { id: true, name: true, city: true } },
                tenant: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
            },
        });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        return unit;
    }
    async findMyUnit(tenantId, orgId) {
        const unit = await this.prisma.unit.findFirst({
            where: { tenantId, orgId },
            include: {
                property: { select: { id: true, name: true, street: true, city: true, postalCode: true } },
            },
        });
        if (!unit)
            throw new common_1.NotFoundException('No unit assigned to this tenant');
        return unit;
    }
    async create(propertyId, orgId, dto) {
        const property = await this.prisma.property.findFirst({ where: { id: propertyId, orgId } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        const existing = await this.prisma.unit.findFirst({
            where: { propertyId, unitNumber: dto.unitNumber },
        });
        if (existing)
            throw new common_1.ConflictException('Unit number already exists in this property');
        this.logger.log(`Creating unit in property ${propertyId} for org ${orgId}`);
        return this.prisma.unit.create({
            data: { ...dto, propertyId, orgId },
        });
    }
    async update(id, orgId, dto) {
        const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        if (dto.unitNumber && dto.unitNumber !== unit.unitNumber) {
            const existing = await this.prisma.unit.findFirst({
                where: { propertyId: unit.propertyId, unitNumber: dto.unitNumber },
            });
            if (existing)
                throw new common_1.ConflictException('Unit number already exists in this property');
        }
        return this.prisma.unit.update({ where: { id }, data: dto });
    }
    async remove(id, orgId) {
        const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        if (unit.tenantId) {
            throw new common_1.ConflictException('Cannot delete a unit with an active tenant. Remove the tenant first.');
        }
        await this.prisma.unit.delete({ where: { id } });
        return { success: true };
    }
    async removeTenant(id, orgId) {
        const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        if (!unit.tenantId)
            throw new common_1.ConflictException('Unit has no tenant assigned');
        return this.prisma.unit.update({ where: { id }, data: { tenantId: null } });
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = UnitsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnitsService);
//# sourceMappingURL=units.service.js.map