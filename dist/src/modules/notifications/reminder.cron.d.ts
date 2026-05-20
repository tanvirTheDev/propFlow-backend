import { PrismaService } from "../../prisma/prisma.service";
export declare class ReminderCron {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkPendingTickets(): Promise<void>;
}
