import { JwtPayload } from "../auth/types/jwt-payload.type";
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    findAll(user: JwtPayload, filters: ListPropertiesDto): Promise<{
        data: ({
            _count: {
                units: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            notes: string | null;
            latitude: number | null;
            longitude: number | null;
            street: string;
            city: string;
            postalCode: string;
            country: string;
            geocodedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getMapData(user: JwtPayload): Promise<{
        data: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
            country: string;
            latitude: number;
            longitude: number;
            totalUnits: number;
            occupiedUnits: number;
            pinColor: "green" | "amber" | "red";
        }[];
        notGeocodedCount: number;
    }>;
    create(user: JwtPayload, dto: CreatePropertyDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        notes: string | null;
        latitude: number | null;
        longitude: number | null;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        geocodedAt: Date | null;
    }>;
    findOne(user: JwtPayload, id: string): Promise<{
        units: ({
            tenant: {
                id: string;
                name: string;
                createdAt: Date;
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
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        notes: string | null;
        latitude: number | null;
        longitude: number | null;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        geocodedAt: Date | null;
    }>;
    update(user: JwtPayload, id: string, dto: UpdatePropertyDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        notes: string | null;
        latitude: number | null;
        longitude: number | null;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        geocodedAt: Date | null;
    }>;
    remove(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    retryGeocode(user: JwtPayload, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        notes: string | null;
        latitude: number | null;
        longitude: number | null;
        street: string;
        city: string;
        postalCode: string;
        country: string;
        geocodedAt: Date | null;
    }>;
}
