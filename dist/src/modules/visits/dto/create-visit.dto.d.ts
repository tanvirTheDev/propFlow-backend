import { VisitReason } from '@prisma/client';
export declare class VisitUnitDto {
    unitId: string;
    notifyTenant: boolean;
}
export declare class CreateVisitDto {
    propertyId: string;
    scheduledAt: string;
    durationMin?: number;
    reason: VisitReason;
    note?: string;
    units: VisitUnitDto[];
}
