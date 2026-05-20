import { TicketCategory, TicketPriority, EmergencyType } from '@prisma/client';
export declare class CreateTicketDto {
    unitId: string;
    category: TicketCategory;
    priority: TicketPriority;
    title: string;
    description: string;
    photos?: string[];
    isEmergency: boolean;
    emergencyType?: EmergencyType;
}
