import { VisitStatus } from '@prisma/client';
import { JwtPayload } from "../auth/types/jwt-payload.type";
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
declare class VisitQueryDto {
    from?: string;
    to?: string;
    status?: VisitStatus;
    propertyId?: string;
}
export declare class VisitsController {
    private readonly visitsService;
    constructor(visitsService: VisitsService);
    create(user: JwtPayload, dto: CreateVisitDto): Promise<{
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
    findAll(user: JwtPayload, query: VisitQueryDto): Promise<({
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
    findOne(user: JwtPayload, id: string): Promise<{
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
    update(user: JwtPayload, id: string, dto: UpdateVisitDto): Promise<{
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
    complete(user: JwtPayload, id: string, note?: string, endTime?: string): Promise<{
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
    cancel(user: JwtPayload, id: string, reason?: string): Promise<{
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
}
export {};
