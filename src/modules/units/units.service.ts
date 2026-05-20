import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllByProperty(propertyId: string, orgId: string) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, orgId } });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.unit.findMany({
      where: { propertyId, orgId },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, orgId },
      include: {
        property: { select: { id: true, name: true, city: true } },
        tenant: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async findMyUnit(tenantId: string, orgId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { tenantId, orgId },
      include: {
        property: { select: { id: true, name: true, street: true, city: true, postalCode: true } },
      },
    });
    if (!unit) throw new NotFoundException('No unit assigned to this tenant');
    return unit;
  }

  async create(propertyId: string, orgId: string, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({ where: { id: propertyId, orgId } });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await this.prisma.unit.findFirst({
      where: { propertyId, unitNumber: dto.unitNumber },
    });
    if (existing) throw new ConflictException('Unit number already exists in this property');

    this.logger.log(`Creating unit in property ${propertyId} for org ${orgId}`);
    return this.prisma.unit.create({
      data: { ...dto, propertyId, orgId },
    });
  }

  async update(id: string, orgId: string, dto: UpdateUnitDto) {
    const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
    if (!unit) throw new NotFoundException('Unit not found');

    if (dto.unitNumber && dto.unitNumber !== unit.unitNumber) {
      const existing = await this.prisma.unit.findFirst({
        where: { propertyId: unit.propertyId, unitNumber: dto.unitNumber },
      });
      if (existing) throw new ConflictException('Unit number already exists in this property');
    }

    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(id: string, orgId: string) {
    const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
    if (!unit) throw new NotFoundException('Unit not found');

    if (unit.tenantId) {
      throw new ConflictException('Cannot delete a unit with an active tenant. Remove the tenant first.');
    }

    await this.prisma.unit.delete({ where: { id } });
    return { success: true };
  }

  async removeTenant(id: string, orgId: string) {
    const unit = await this.prisma.unit.findFirst({ where: { id, orgId } });
    if (!unit) throw new NotFoundException('Unit not found');
    if (!unit.tenantId) throw new ConflictException('Unit has no tenant assigned');

    return this.prisma.unit.update({ where: { id }, data: { tenantId: null } });
  }
}
