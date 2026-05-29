import { Role, VisitStatus } from '@prisma/client';
import { PrismaService } from "../../prisma/prisma.service";
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
export declare class VisitsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(orgId: string, userId: string, dto: CreateVisitDto): Promise<{
        visit: {
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
                postalCode: string;
            };
            units: ({
                unit: {
                    id: string;
                    unitNumber: string;
                };
                tenant: {
                    id: string;
                    name: string;
                    email: string;
                    language: string;
                } | null;
            } & {
                id: string;
                unitId: string;
                tenantId: string | null;
                notifyTenant: boolean;
                emailSentAt: Date | null;
                visitId: string;
            })[];
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            propertyId: string;
            status: import("@prisma/client").$Enums.VisitStatus;
            scheduledAt: Date;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
            reason: import("@prisma/client").$Enums.VisitReason;
        };
        warning: string | undefined;
    }>;
    findAll(orgId: string, userId: string, role: Role, query: {
        from?: string;
        to?: string;
        status?: VisitStatus;
        propertyId?: string;
    }): Promise<({
        property: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
        };
        units: ({
            unit: {
                id: string;
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
                email: string;
                language: string;
            } | null;
        } & {
            id: string;
            unitId: string;
            tenantId: string | null;
            notifyTenant: boolean;
            emailSentAt: Date | null;
            visitId: string;
        })[];
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        propertyId: string;
        status: import("@prisma/client").$Enums.VisitStatus;
        scheduledAt: Date;
        createdById: string;
        durationMin: number;
        note: string | null;
        cancelReason: string | null;
        completedAt: Date | null;
        reason: import("@prisma/client").$Enums.VisitReason;
    })[]>;
    findOne(id: string, orgId: string, userId: string, role: Role): Promise<{
        property: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
        };
        units: ({
            unit: {
                id: string;
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
                email: string;
                language: string;
            } | null;
        } & {
            id: string;
            unitId: string;
            tenantId: string | null;
            notifyTenant: boolean;
            emailSentAt: Date | null;
            visitId: string;
        })[];
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        propertyId: string;
        status: import("@prisma/client").$Enums.VisitStatus;
        scheduledAt: Date;
        createdById: string;
        durationMin: number;
        note: string | null;
        cancelReason: string | null;
        completedAt: Date | null;
        reason: import("@prisma/client").$Enums.VisitReason;
    }>;
    update(id: string, orgId: string, userId: string, dto: UpdateVisitDto): Promise<{
        visit: {
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
                postalCode: string;
            };
            units: ({
                unit: {
                    id: string;
                    unitNumber: string;
                };
                tenant: {
                    id: string;
                    name: string;
                    email: string;
                    language: string;
                } | null;
            } & {
                id: string;
                unitId: string;
                tenantId: string | null;
                notifyTenant: boolean;
                emailSentAt: Date | null;
                visitId: string;
            })[];
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            propertyId: string;
            status: import("@prisma/client").$Enums.VisitStatus;
            scheduledAt: Date;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
            reason: import("@prisma/client").$Enums.VisitReason;
        };
        warning: string | undefined;
    }>;
    complete(id: string, orgId: string, note?: string, endTime?: string): Promise<{
        property: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
        };
        units: ({
            unit: {
                id: string;
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
                email: string;
                language: string;
            } | null;
        } & {
            id: string;
            unitId: string;
            tenantId: string | null;
            notifyTenant: boolean;
            emailSentAt: Date | null;
            visitId: string;
        })[];
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        propertyId: string;
        status: import("@prisma/client").$Enums.VisitStatus;
        scheduledAt: Date;
        createdById: string;
        durationMin: number;
        note: string | null;
        cancelReason: string | null;
        completedAt: Date | null;
        reason: import("@prisma/client").$Enums.VisitReason;
    }>;
    cancel(id: string, orgId: string, reason?: string): Promise<{
        property: {
            id: string;
            name: string;
            street: string;
            city: string;
            postalCode: string;
        };
        units: ({
            unit: {
                id: string;
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
                email: string;
                language: string;
            } | null;
        } & {
            id: string;
            unitId: string;
            tenantId: string | null;
            notifyTenant: boolean;
            emailSentAt: Date | null;
            visitId: string;
        })[];
        createdBy: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orgId: string;
        propertyId: string;
        status: import("@prisma/client").$Enums.VisitStatus;
        scheduledAt: Date;
        createdById: string;
        durationMin: number;
        note: string | null;
        cancelReason: string | null;
        completedAt: Date | null;
        reason: import("@prisma/client").$Enums.VisitReason;
    }>;
    private enqueueVisitNotifications;
}
