"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var InvitesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
let InvitesService = InvitesService_1 = class InvitesService {
    constructor(prisma, mail, config) {
        this.prisma = prisma;
        this.mail = mail;
        this.config = config;
        this.logger = new common_1.Logger(InvitesService_1.name);
    }
    generateToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    expiresAt() {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d;
    }
    async findAll(orgId) {
        return this.prisma.tenantInvite.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(orgId, dto) {
        const unit = await this.prisma.unit.findFirst({
            where: { id: dto.unitId, orgId },
        });
        if (!unit)
            throw new common_1.NotFoundException('Unit not found');
        if (unit.tenantId)
            throw new common_1.ConflictException('Unit already has an active tenant');
        const pending = await this.prisma.tenantInvite.findFirst({
            where: { unitId: dto.unitId, acceptedAt: null, expiresAt: { gt: new Date() } },
        });
        if (pending)
            throw new common_1.ConflictException('A pending invite already exists for this unit');
        const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
        const token = this.generateToken();
        const expiresAt = this.expiresAt();
        this.logger.log(`Creating invite for unit ${dto.unitId} in org ${orgId}`);
        const invite = await this.prisma.tenantInvite.create({
            data: { orgId, unitId: dto.unitId, email: dto.email, name: dto.name, token, expiresAt },
        });
        const frontendUrl = this.config.get('FRONTEND_URL');
        await this.mail.sendTenantInvite({
            to: dto.email,
            name: dto.name,
            orgName: org?.name ?? 'Your Landlord',
            inviteLink: `${frontendUrl}/invite/${token}`,
            expiresAt,
        });
        return invite;
    }
    async resend(id, orgId) {
        const invite = await this.prisma.tenantInvite.findFirst({ where: { id, orgId } });
        if (!invite)
            throw new common_1.NotFoundException('Invite not found');
        if (invite.acceptedAt)
            throw new common_1.BadRequestException('Invite already accepted');
        const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
        const token = this.generateToken();
        const expiresAt = this.expiresAt();
        this.logger.log(`Resending invite ${id} for org ${orgId}`);
        const updated = await this.prisma.tenantInvite.update({
            where: { id },
            data: { token, expiresAt },
        });
        const frontendUrl = this.config.get('FRONTEND_URL');
        await this.mail.sendTenantInvite({
            to: invite.email,
            name: invite.name,
            orgName: org?.name ?? 'Your Landlord',
            inviteLink: `${frontendUrl}/invite/${token}`,
            expiresAt,
        });
        return updated;
    }
    async cancel(id, orgId) {
        const invite = await this.prisma.tenantInvite.findFirst({ where: { id, orgId } });
        if (!invite)
            throw new common_1.NotFoundException('Invite not found');
        if (invite.acceptedAt)
            throw new common_1.BadRequestException('Cannot cancel an accepted invite');
        await this.prisma.tenantInvite.delete({ where: { id } });
        return { success: true };
    }
};
exports.InvitesService = InvitesService;
exports.InvitesService = InvitesService = InvitesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        config_1.ConfigService])
], InvitesService);
//# sourceMappingURL=invites.service.js.map