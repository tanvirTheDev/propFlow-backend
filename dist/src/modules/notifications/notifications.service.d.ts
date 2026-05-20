import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import type { ListInAppDto } from './dto/list-in-app.dto';
interface QueueEntry {
    id: string;
    orgId: string;
    targetUserId: string;
    type: string;
    channels: string[];
    payload: unknown;
    attempts: number;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly mail;
    private readonly config;
    private readonly logger;
    private readonly vapidConfigured;
    private readonly frontendUrl;
    constructor(prisma: PrismaService, mail: MailService, config: ConfigService);
    processEntry(entry: QueueEntry): Promise<void>;
    private sendEmail;
    private sendPush;
    private createInApp;
    savePushSubscription(userId: string, subscription: Record<string, unknown>): Promise<void>;
    removePushSubscription(userId: string): Promise<void>;
    listInApp(userId: string, dto: ListInAppDto): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        orgId: string;
        title: string;
        type: string;
        payload: Prisma.JsonValue | null;
        userId: string;
        body: string;
        isRead: boolean;
    }[]>;
    markRead(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        orgId: string;
        title: string;
        type: string;
        payload: Prisma.JsonValue | null;
        userId: string;
        body: string;
        isRead: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        count: number;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
export {};
