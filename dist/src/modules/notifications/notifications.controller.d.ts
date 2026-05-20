import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { NotificationsService } from './notifications.service';
import { SavePushSubscriptionDto } from './dto/save-push-subscription.dto';
import { ListInAppDto } from './dto/list-in-app.dto';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    savePushSubscription(user: JwtPayload, dto: SavePushSubscriptionDto): Promise<{
        success: boolean;
    }>;
    removePushSubscription(user: JwtPayload): Promise<{
        success: boolean;
    }>;
    listInApp(user: JwtPayload, dto: ListInAppDto): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        orgId: string;
        title: string;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        body: string;
        isRead: boolean;
    }[]>;
    markRead(user: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        link: string | null;
        orgId: string;
        title: string;
        type: string;
        payload: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string;
        body: string;
        isRead: boolean;
    }>;
    markAllRead(user: JwtPayload): Promise<{
        count: number;
    }>;
    getUnreadCount(user: JwtPayload): Promise<{
        count: number;
    }>;
}
