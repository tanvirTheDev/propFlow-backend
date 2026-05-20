import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from './notifications.service';
export declare class NotificationQueueProcessor {
    private readonly prisma;
    private readonly notifications;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    processQueue(): Promise<void>;
}
