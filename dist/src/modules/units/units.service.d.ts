import { PrismaService } from "../../prisma/prisma.service";
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
export declare class UnitsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAllByProperty(propertyId: string, orgId: string): Promise<({
        tenant: {
            id: string;
            name: string;
            email: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    })[]>;
    findOne(id: string, orgId: string): Promise<{
        property: {
            id: string;
            name: string;
            city: string;
        };
        tenant: {
            id: string;
            name: string;
            createdAt: Date;
            email: string;
            phone: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    }>;
    findMyUnit(tenantId: string, orgId: string): Promise<{
        property: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    }>;
    create(propertyId: string, orgId: string, dto: CreateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    }>;
    update(id: string, orgId: string, dto: UpdateUnitDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    }>;
    remove(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
    removeTenant(id: string, orgId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        tenantId: string | null;
        propertyId: string;
        unitNumber: string;
        floor: number | null;
        bedrooms: number | null;
        sizeM2: number | null;
        notes: string | null;
    }>;
}
