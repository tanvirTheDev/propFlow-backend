import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

const DOC_INCLUDE = {
  uploadedBy: { select: { id: true, name: true } },
  property: { select: { id: true, name: true } },
  unit: { select: { id: true, unitNumber: true } },
  tenant: { select: { id: true, name: true } },
} as const;

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, orgId: string, uploadedById: string) {
    if (!dto.propertyId && !dto.unitId && !dto.tenantId) {
      throw new BadRequestException('At least one scope (propertyId, unitId, or tenantId) is required');
    }

    if (dto.propertyId) {
      const property = await this.prisma.property.findFirst({ where: { id: dto.propertyId, orgId } });
      if (!property) throw new NotFoundException('Property not found');
    }
    if (dto.unitId) {
      const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, orgId } });
      if (!unit) throw new NotFoundException('Unit not found');
    }
    if (dto.tenantId) {
      const tenant = await this.prisma.user.findFirst({
        where: { id: dto.tenantId, orgId, role: Role.TENANT },
      });
      if (!tenant) throw new NotFoundException('Tenant not found');
    }
    if (dto.leaseId) {
      const lease = await this.prisma.lease.findFirst({ where: { id: dto.leaseId, orgId } });
      if (!lease) throw new NotFoundException('Lease not found');
    }

    const doc = await this.prisma.document.create({
      data: {
        orgId,
        uploadedById,
        name: dto.name,
        description: dto.description,
        fileUrl: dto.fileUrl,
        fileType: dto.fileType,
        fileSizeBytes: dto.fileSizeBytes,
        category: dto.category,
        visibility: dto.visibility,
        propertyId: dto.propertyId ?? null,
        unitId: dto.unitId ?? null,
        tenantId: dto.tenantId ?? null,
        leaseId: dto.leaseId ?? null,
      },
      include: DOC_INCLUDE,
    });

    this.prisma.documentAccessLog
      .create({ data: { documentId: doc.id, userId: uploadedById } })
      .catch(() => {});

    return doc;
  }

  async findAll(
    orgId: string,
    userId: string,
    role: Role,
    query: {
      propertyId?: string;
      unitId?: string;
      tenantId?: string;
      category?: string;
      visibility?: string;
    },
  ) {
    const where = this.buildListFilter(orgId, userId, role, query);
    return this.prisma.document.findMany({
      where,
      include: DOC_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string, userId: string, role: Role) {
    const where = this.buildAccessFilter(id, orgId, userId, role);
    const doc = await this.prisma.document.findFirst({ where, include: DOC_INCLUDE });
    if (!doc) throw new NotFoundException('Document not found');

    this.prisma.documentAccessLog
      .create({ data: { documentId: id, userId } })
      .catch(() => {});

    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, orgId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, orgId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.document.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
      },
      include: DOC_INCLUDE,
    });
  }

  async remove(id: string, orgId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, orgId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.delete({ where: { id } });
    return { success: true };
  }

  async getAccessLogs(id: string, orgId: string) {
    const doc = await this.prisma.document.findFirst({ where: { id, orgId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.documentAccessLog.findMany({
      where: { documentId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { accessedAt: 'desc' },
    });
  }

  private buildListFilter(
    orgId: string,
    userId: string,
    role: Role,
    query: { propertyId?: string; unitId?: string; tenantId?: string; category?: string; visibility?: string },
  ) {
    const base: Record<string, unknown> = { orgId };

    if (query.propertyId) base['propertyId'] = query.propertyId;
    if (query.unitId) base['unitId'] = query.unitId;
    if (query.category) base['category'] = query.category;
    if (query.visibility) base['visibility'] = query.visibility;

    if (role === Role.TENANT) {
      return {
        ...base,
        visibility: 'SHARED_WITH_TENANT' as const,
        OR: [
          { tenantId: userId },
          { unit: { tenantId: userId } },
          { property: { units: { some: { tenantId: userId } } } },
        ],
      };
    }

    if (query.tenantId) base['tenantId'] = query.tenantId;
    return base;
  }

  private buildAccessFilter(id: string, orgId: string, userId: string, role: Role) {
    if (role === Role.LANDLORD || role === Role.SUPER_ADMIN) {
      return { id, orgId };
    }
    return {
      id,
      orgId,
      visibility: 'SHARED_WITH_TENANT' as const,
      OR: [
        { tenantId: userId },
        { unit: { tenantId: userId } },
        { property: { units: { some: { tenantId: userId } } } },
      ],
    };
  }
}
