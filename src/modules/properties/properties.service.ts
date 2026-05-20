import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GeocodingService } from './geocoding.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';

const ADDRESS_FIELDS = ['street', 'city', 'postalCode', 'country'] as const;

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocoding: GeocodingService,
  ) {}

  async findAll(orgId: string, filters: ListPropertiesDto) {
    const { search, city, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      orgId,
      ...(city && { city }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { street: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
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

  async findOne(id: string, orgId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, orgId },
      include: {
        units: {
          include: { tenant: { select: { id: true, name: true, email: true, createdAt: true } } },
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(orgId: string, dto: CreatePropertyDto) {
    this.logger.log(`Creating property for org ${orgId}`);
    const property = await this.prisma.property.create({
      data: { ...dto, orgId, country: dto.country ?? 'Germany' },
    });

    // fire-and-forget geocoding
    this.geocodeProperty(property.id, property.street, property.city, property.postalCode, property.country).catch(
      () => {},
    );

    return property;
  }

  async update(id: string, orgId: string, dto: UpdatePropertyDto) {
    const property = await this.prisma.property.findFirst({ where: { id, orgId } });
    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({ where: { id }, data: dto });

    const addressChanged = ADDRESS_FIELDS.some(
      (f) => dto[f] !== undefined && dto[f] !== (property as Record<string, unknown>)[f],
    );
    if (addressChanged) {
      this.geocodeProperty(
        id,
        updated.street,
        updated.city,
        updated.postalCode,
        updated.country,
      ).catch(() => {});
    }

    return updated;
  }

  async remove(id: string, orgId: string) {
    const property = await this.prisma.property.findFirst({ where: { id, orgId } });
    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.property.delete({ where: { id } });
    return { success: true };
  }

  async getRecentProperties(orgId: string, take = 5) {
    return this.prisma.property.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { _count: { select: { units: true } } },
    });
  }

  async getMapData(orgId: string) {
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

      let pinColor: 'green' | 'amber' | 'red';
      if (totalUnits === 0 || occupiedUnits === 0) {
        pinColor = 'red';
      } else if (occupiedUnits === totalUnits) {
        pinColor = 'green';
      } else {
        pinColor = 'amber';
      }

      return {
        id: p.id,
        name: p.name,
        street: p.street,
        city: p.city,
        postalCode: p.postalCode,
        country: p.country,
        latitude: p.latitude!,
        longitude: p.longitude!,
        totalUnits,
        occupiedUnits,
        pinColor,
      };
    });

    return { data, notGeocodedCount };
  }

  async retryGeocode(id: string, orgId: string) {
    const property = await this.prisma.property.findFirst({ where: { id, orgId } });
    if (!property) throw new NotFoundException('Property not found');

    const coords = await this.geocoding.geocode(
      property.street,
      property.city,
      property.postalCode,
      property.country,
    );

    if (!coords) {
      throw new UnprocessableEntityException('Address could not be geocoded');
    }

    return this.prisma.property.update({
      where: { id },
      data: { latitude: coords.latitude, longitude: coords.longitude, geocodedAt: new Date() },
    });
  }

  private async geocodeProperty(
    id: string,
    street: string,
    city: string,
    postalCode: string,
    country: string,
  ) {
    const coords = await this.geocoding.geocode(street, city, postalCode, country);
    if (!coords) return;

    await this.prisma.property.update({
      where: { id },
      data: { latitude: coords.latitude, longitude: coords.longitude, geocodedAt: new Date() },
    });
    this.logger.log(`Geocoded property ${id}: ${coords.latitude},${coords.longitude}`);
  }
}
