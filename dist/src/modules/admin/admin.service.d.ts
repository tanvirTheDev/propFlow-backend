import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { AddLandlordDto } from './dto/add-landlord.dto';
import { ListOrgsDto } from './dto/list-orgs.dto';
import { ListQueueDto } from './dto/list-queue.dto';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listOrgs(dto: ListOrgsDto): Promise<{
        data: {
            id: string;
            name: string;
            createdAt: Date;
            landlordCount: number;
            tenantCount: number;
            propertyCount: number;
            unitCount: number;
            ticketCount: number;
        }[];
        total: number;
        page: number;
    }>;
    createOrg(dto: CreateOrgDto): Promise<{
        organisation: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        user: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            orgId: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            language: string;
            isActive: boolean;
            emailVerified: boolean;
        };
    }>;
    getOrg(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        landlordCount: number;
        tenantCount: number;
        propertyCount: number;
        unitCount: number;
        ticketCount: number;
        userCount: number;
    }>;
    updateOrg(id: string, dto: UpdateOrgDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listOrgUsers(orgId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        language: string;
        isActive: boolean;
        emailVerified: boolean;
    }[]>;
    addLandlord(orgId: string, dto: AddLandlordDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        orgId: string;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        language: string;
        isActive: boolean;
        emailVerified: boolean;
    }>;
    deactivateUser(callerId: string, userId: string): Promise<{
        success: boolean;
    }>;
    activateUser(userId: string): Promise<{
        success: boolean;
    }>;
    getStats(): Promise<{
        organisations: number;
        landlords: number;
        tenants: number;
        properties: number;
        units: number;
        tickets: {
            total: number;
            open: number;
            inProgress: number;
            emergencies: number;
        };
        emailsSentToday: number;
        failedNotifications: number;
    }>;
    listQueue(dto: ListQueueDto): Promise<{
        id: string;
        createdAt: Date;
        orgId: string;
        status: string;
        targetUserId: string;
        type: string;
        channels: string[];
        attempts: number;
        scheduledAt: Date;
        sentAt: Date | null;
    }[]>;
}
