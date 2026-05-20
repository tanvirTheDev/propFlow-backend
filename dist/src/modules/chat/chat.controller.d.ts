import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    listMessages(user: JwtPayload, ticketId: string, dto: ListMessagesDto): Promise<{
        data: ({
            sender: {
                id: string;
                name: string;
            } | null;
            reads: {
                userId: string;
                readAt: Date;
            }[];
        } & {
            id: string;
            createdAt: Date;
            orgId: string;
            content: string;
            type: import("@prisma/client").$Enums.MessageType;
            ticketId: string;
            senderId: string | null;
            photo: string | null;
            systemKey: string | null;
            systemData: import("@prisma/client/runtime/client").JsonValue | null;
        })[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
    sendMessage(user: JwtPayload, ticketId: string, dto: SendMessageDto): Promise<{
        sender: {
            id: string;
            name: string;
        } | null;
        reads: {
            userId: string;
            readAt: Date;
        }[];
    } & {
        id: string;
        createdAt: Date;
        orgId: string;
        content: string;
        type: import("@prisma/client").$Enums.MessageType;
        ticketId: string;
        senderId: string | null;
        photo: string | null;
        systemKey: string | null;
        systemData: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    markAllRead(user: JwtPayload, ticketId: string): Promise<{
        markedCount: number;
    }>;
    getUnreadCount(user: JwtPayload): Promise<{
        count: number;
        byTicket: Record<string, number>;
    }>;
}
