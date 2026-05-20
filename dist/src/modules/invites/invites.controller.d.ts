import { JwtPayload } from "../auth/types/jwt-payload.type";
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
export declare class InvitesController {
    private readonly invitesService;
    constructor(invitesService: InvitesService);
    findAll(user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        orgId: string;
        token: string;
        unitId: string;
        expiresAt: Date;
        acceptedAt: Date | null;
    }[]>;
    create(user: JwtPayload, dto: CreateInviteDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        orgId: string;
        token: string;
        unitId: string;
        expiresAt: Date;
        acceptedAt: Date | null;
    }>;
    resend(user: JwtPayload, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        email: string;
        orgId: string;
        token: string;
        unitId: string;
        expiresAt: Date;
        acceptedAt: Date | null;
    }>;
    cancel(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
