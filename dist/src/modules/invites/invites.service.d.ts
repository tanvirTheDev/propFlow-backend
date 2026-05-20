import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { CreateInviteDto } from './dto/create-invite.dto';
export declare class InvitesService {
    private readonly prisma;
    private readonly mail;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, mail: MailService, config: ConfigService);
    private generateToken;
    private expiresAt;
    findAll(orgId: string): Promise<{
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
    create(orgId: string, dto: CreateInviteDto): Promise<{
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
    resend(id: string, orgId: string): Promise<{
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
    cancel(id: string, orgId: string): Promise<{
        success: boolean;
    }>;
}
