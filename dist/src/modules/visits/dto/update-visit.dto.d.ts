import { VisitReason } from '@prisma/client';
import { VisitUnitDto } from './create-visit.dto';
export declare class UpdateVisitDto {
    scheduledAt?: string;
    durationMin?: number;
    reason?: VisitReason;
    note?: string;
    units?: VisitUnitDto[];
}
