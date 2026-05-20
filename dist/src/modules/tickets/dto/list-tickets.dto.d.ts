import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';
export declare class ListTicketsDto {
    status?: TicketStatus;
    priority?: TicketPriority;
    category?: TicketCategory;
    isEmergency?: boolean;
    propertyId?: string;
    search?: string;
    sort?: 'newest' | 'oldest' | 'priority' | 'last_activity';
    page?: number;
    limit?: number;
}
