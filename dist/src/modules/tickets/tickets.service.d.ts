import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';
export declare class TicketsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private validatePhotoUrls;
    create(user: JwtPayload, dto: CreateTicketDto): Promise<{
        unit: {
            id: string;
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
            };
            unitNumber: string;
        };
        tenant: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
        statusHistory: {
            id: string;
            fromStatus: import("@prisma/client").$Enums.TicketStatus | null;
            toStatus: import("@prisma/client").$Enums.TicketStatus;
            changedBy: string;
            changedAt: Date;
            ticketId: string;
        }[];
        appointments: ({
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
            ticketId: string;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
        })[];
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
    }>;
    findAll(user: JwtPayload, dto: ListTicketsDto): Promise<{
        data: ({
            unit: {
                id: string;
                property: {
                    id: string;
                    name: string;
                    street: string;
                    city: string;
                };
                unitNumber: string;
            };
            tenant: {
                id: string;
                name: string;
                email: string;
                phone: string | null;
            };
            statusHistory: {
                id: string;
                fromStatus: import("@prisma/client").$Enums.TicketStatus | null;
                toStatus: import("@prisma/client").$Enums.TicketStatus;
                changedBy: string;
                changedAt: Date;
                ticketId: string;
            }[];
            appointments: ({
                createdBy: {
                    id: string;
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                orgId: string;
                status: import("@prisma/client").$Enums.AppointmentStatus;
                scheduledAt: Date;
                ticketId: string;
                createdById: string;
                durationMin: number;
                note: string | null;
                cancelReason: string | null;
                completedAt: Date | null;
            })[];
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
        total: number;
        page: number;
        limit: number;
    }>;
    private resolveOrderBy;
    findOne(user: JwtPayload, id: string): Promise<{
        unit: {
            id: string;
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
            };
            unitNumber: string;
        };
        notes: {
            id: string;
            createdAt: Date;
            content: string;
            ticketId: string;
            authorId: string;
        }[];
        tenant: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
        statusHistory: {
            id: string;
            fromStatus: import("@prisma/client").$Enums.TicketStatus | null;
            toStatus: import("@prisma/client").$Enums.TicketStatus;
            changedBy: string;
            changedAt: Date;
            ticketId: string;
        }[];
        appointments: ({
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
            ticketId: string;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
        })[];
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
    }>;
    updateStatus(user: JwtPayload, id: string, dto: UpdateTicketStatusDto): Promise<{
        unit: {
            id: string;
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
            };
            unitNumber: string;
        };
        tenant: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
        statusHistory: {
            id: string;
            fromStatus: import("@prisma/client").$Enums.TicketStatus | null;
            toStatus: import("@prisma/client").$Enums.TicketStatus;
            changedBy: string;
            changedAt: Date;
            ticketId: string;
        }[];
        appointments: ({
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
            ticketId: string;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
        })[];
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
    }>;
    createNote(user: JwtPayload, ticketId: string, dto: CreateNoteDto): Promise<{
        author: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        ticketId: string;
        authorId: string;
    }>;
    findNotes(user: JwtPayload, ticketId: string): Promise<({
        author: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        ticketId: string;
        authorId: string;
    })[]>;
    findUnitHistory(user: JwtPayload, unitId: string): Promise<({
        unit: {
            id: string;
            property: {
                id: string;
                name: string;
                street: string;
                city: string;
            };
            unitNumber: string;
        };
        tenant: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
        };
        statusHistory: {
            id: string;
            fromStatus: import("@prisma/client").$Enums.TicketStatus | null;
            toStatus: import("@prisma/client").$Enums.TicketStatus;
            changedBy: string;
            changedAt: Date;
            ticketId: string;
        }[];
        appointments: ({
            createdBy: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orgId: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            scheduledAt: Date;
            ticketId: string;
            createdById: string;
            durationMin: number;
            note: string | null;
            cancelReason: string | null;
            completedAt: Date | null;
        })[];
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
    })[]>;
}
