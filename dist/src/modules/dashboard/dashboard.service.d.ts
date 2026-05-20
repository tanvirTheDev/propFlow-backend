import { PrismaService } from "../../prisma/prisma.service";
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLandlordStats(orgId: string): Promise<{
        totalProperties: number;
        totalUnits: number;
        occupiedUnits: number;
        vacantUnits: number;
        occupancyRate: number;
        pendingInvites: number;
        openTickets: number;
        inProgressTickets: number;
        emergencyTickets: number;
        recentProperties: ({
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
        recentTickets: ({
            unit: {
                id: string;
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            unitId: string;
            tenantId: string;
            priority: import("@prisma/client").$Enums.TicketPriority;
            status: import("@prisma/client").$Enums.TicketStatus;
            isEmergency: boolean;
            ticketNumber: string;
            category: import("@prisma/client").$Enums.TicketCategory;
            title: string;
            description: string;
            photos: string[];
            emergencyType: import("@prisma/client").$Enums.EmergencyType | null;
            closedAt: Date | null;
            lastActivity: Date;
        })[];
    }>;
    getAdminStats(): Promise<{
        totalOrgs: number;
        totalUsers: number;
        totalProperties: number;
        totalUnits: number;
    }>;
}
