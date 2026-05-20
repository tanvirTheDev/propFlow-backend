import { JwtPayload } from "../auth/types/jwt-payload.type";
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
export declare class UnitsController {
    private readonly unitsService;
    constructor(unitsService: UnitsService);
    findAllByProperty(user: JwtPayload, propertyId: string): Promise<({
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
    create(user: JwtPayload, propertyId: string, dto: CreateUnitDto): Promise<{
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
    findMyUnit(user: JwtPayload): Promise<{
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
    findOne(user: JwtPayload, id: string): Promise<{
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
    update(user: JwtPayload, id: string, dto: UpdateUnitDto): Promise<{
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
    remove(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    removeTenant(user: JwtPayload, id: string): Promise<{
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
