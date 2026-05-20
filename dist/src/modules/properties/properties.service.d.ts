import { PrismaService } from "../../prisma/prisma.service";
import { GeocodingService } from './geocoding.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { ListPropertiesDto } from './dto/list-properties.dto';
export declare class PropertiesService {
    private readonly prisma;
    private readonly geocoding;
    private readonly logger;
    constructor(prisma: PrismaService, geocoding: GeocodingService);
    findAll(orgId: string, filters: ListPropertiesDto): Promise<{
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
    findOne(id: string, orgId: string): Promise<{
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
    create(orgId: string, dto: CreatePropertyDto): Promise<{
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
    update(id: string, orgId: string, dto: UpdatePropertyDto): Promise<{
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
    remove(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
    getRecentProperties(orgId: string, take?: number): Promise<({
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
    })[]>;
    getMapData(orgId: string): Promise<{
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
    retryGeocode(id: string, orgId: string): Promise<{
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
    private geocodeProperty;
}
