import { PrismaService } from "../../prisma/prisma.service";
import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
export declare class AppointmentsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private getTicketOrFail;
    private getAppointmentOrFail;
    private createSystemMessage;
    private cancelPendingReminders;
    private scheduleReminders;
    create(user: JwtPayload, ticketId: string, dto: CreateAppointmentDto): Promise<{
        appointment: {
            ticket: {
                id: string;
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
                priority: import("@prisma/client").$Enums.TicketPriority;
                tenantId: string;
                ticketNumber: string;
                title: string;
            };
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
        };
        warnings: string[];
    }>;
    findAll(user: JwtPayload, dto: ListAppointmentsDto): Promise<({
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    })[]>;
    findUpcoming(user: JwtPayload): Promise<({
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    })[]>;
    findOne(user: JwtPayload, id: string): Promise<{
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    }>;
    update(user: JwtPayload, id: string, dto: UpdateAppointmentDto): Promise<{
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    }>;
    complete(user: JwtPayload, id: string, dto: CompleteAppointmentDto): Promise<{
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    }>;
    cancel(user: JwtPayload, id: string, dto: CancelAppointmentDto): Promise<{
        ticket: {
            id: string;
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
            priority: import("@prisma/client").$Enums.TicketPriority;
            tenantId: string;
            ticketNumber: string;
            title: string;
        };
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
    }>;
}
