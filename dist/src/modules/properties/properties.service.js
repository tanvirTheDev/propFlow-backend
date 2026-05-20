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
var PropertiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const geocoding_service_1 = require("./geocoding.service");
const ADDRESS_FIELDS = ['street', 'city', 'postalCode', 'country'];
let PropertiesService = PropertiesService_1 = class PropertiesService {
    constructor(prisma, geocoding) {
        this.prisma = prisma;
        this.geocoding = geocoding;
        this.logger = new common_1.Logger(PropertiesService_1.name);
    }
    async findAll(orgId, filters) {
        const { search, city, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;
        const where = {
            orgId,
            ...(city && { city }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { street: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.property.findMany({
                where,
                include: { _count: { select: { units: true } } },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.property.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async findOne(id, orgId) {
        const property = await this.prisma.property.findFirst({
            where: { id, orgId },
            include: {
                units: {
                    include: { tenant: { select: { id: true, name: true, email: true, createdAt: true } } },
                    orderBy: { unitNumber: 'asc' },
                },
            },
        });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        return property;
    }
    async create(orgId, dto) {
        this.logger.log(`Creating property for org ${orgId}`);
        const property = await this.prisma.property.create({
            data: { ...dto, orgId, country: dto.country ?? 'Germany' },
        });
        this.geocodeProperty(property.id, property.street, property.city, property.postalCode, property.country).catch(() => { });
        return property;
    }
    async update(id, orgId, dto) {
        const property = await this.prisma.property.findFirst({ where: { id, orgId } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        const updated = await this.prisma.property.update({ where: { id }, data: dto });
        const addressChanged = ADDRESS_FIELDS.some((f) => dto[f] !== undefined && dto[f] !== property[f]);
        if (addressChanged) {
            this.geocodeProperty(id, updated.street, updated.city, updated.postalCode, updated.country).catch(() => { });
        }
        return updated;
    }
    async remove(id, orgId) {
        const property = await this.prisma.property.findFirst({ where: { id, orgId } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        await this.prisma.property.delete({ where: { id } });
        return { success: true };
    }
    async getRecentProperties(orgId, take = 5) {
        return this.prisma.property.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
            take,
            include: { _count: { select: { units: true } } },
        });
    }
    async getMapData(orgId) {
        const properties = await this.prisma.property.findMany({
            where: { orgId, latitude: { not: null }, longitude: { not: null } },
            include: {
                units: { select: { id: true, tenantId: true } },
            },
        });
        const notGeocodedCount = await this.prisma.property.count({
            where: { orgId, latitude: null },
        });
        const data = properties.map((p) => {
            const totalUnits = p.units.length;
            const occupiedUnits = p.units.filter((u) => u.tenantId !== null).length;
            let pinColor;
            if (totalUnits === 0 || occupiedUnits === 0) {
                pinColor = 'red';
            }
            else if (occupiedUnits === totalUnits) {
                pinColor = 'green';
            }
            else {
                pinColor = 'amber';
            }
            return {
                id: p.id,
                name: p.name,
                street: p.street,
                city: p.city,
                postalCode: p.postalCode,
                country: p.country,
                latitude: p.latitude,
                longitude: p.longitude,
                totalUnits,
                occupiedUnits,
                pinColor,
            };
        });
        return { data, notGeocodedCount };
    }
    async retryGeocode(id, orgId) {
        const property = await this.prisma.property.findFirst({ where: { id, orgId } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        const coords = await this.geocoding.geocode(property.street, property.city, property.postalCode, property.country);
        if (!coords) {
            throw new common_1.UnprocessableEntityException('Address could not be geocoded');
        }
        return this.prisma.property.update({
            where: { id },
            data: { latitude: coords.latitude, longitude: coords.longitude, geocodedAt: new Date() },
        });
    }
    async geocodeProperty(id, street, city, postalCode, country) {
        const coords = await this.geocoding.geocode(street, city, postalCode, country);
        if (!coords)
            return;
        await this.prisma.property.update({
            where: { id },
            data: { latitude: coords.latitude, longitude: coords.longitude, geocodedAt: new Date() },
        });
        this.logger.log(`Geocoded property ${id}: ${coords.latitude},${coords.longitude}`);
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = PropertiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        geocoding_service_1.GeocodingService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map