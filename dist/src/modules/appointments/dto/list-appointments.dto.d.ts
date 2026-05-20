import { AppointmentStatus } from '@prisma/client';
export declare class ListAppointmentsDto {
    from?: string;
    to?: string;
    status?: AppointmentStatus;
}
