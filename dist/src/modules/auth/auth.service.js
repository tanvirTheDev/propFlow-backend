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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const prisma_service_1 = require("../../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const BCRYPT_ROUNDS = 12;
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, usersService, jwtService, configService, mailService) {
        this.prisma = prisma;
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const [org, user] = await this.prisma.$transaction(async (tx) => {
            const organisation = await tx.organisation.create({
                data: { name: dto.organisationName },
            });
            const newUser = await tx.user.create({
                data: {
                    orgId: organisation.id,
                    role: client_1.Role.LANDLORD,
                    name: dto.name,
                    email: dto.email,
                    password: hashedPassword,
                },
            });
            return [organisation, newUser];
        });
        this.logger.log(`Registered landlord ${user.id} for org ${org.id}`);
        const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const passwordValid = await bcrypt.compare(dto.password, user.password);
        if (!passwordValid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.isActive)
            throw new common_1.ForbiddenException('Your account has been deactivated. Contact support.');
        this.logger.log(`User ${user.id} logged in`);
        const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    async refresh(userId, rawRefreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken)
            throw new common_1.UnauthorizedException('Access denied');
        const tokenValid = await bcrypt.compare(rawRefreshToken, user.refreshToken);
        if (!tokenValid)
            throw new common_1.UnauthorizedException('Access denied');
        const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }
    async logout(userId) {
        await this.usersService.updateRefreshToken(userId, null);
        return { success: true };
    }
    async getMe(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.sanitizeUser(user);
    }
    async acceptInvite(dto) {
        const invite = await this.prisma.tenantInvite.findUnique({
            where: { token: dto.token },
        });
        if (!invite)
            throw new common_1.NotFoundException('Invite not found');
        if (invite.acceptedAt)
            throw new common_1.BadRequestException('Invite already accepted');
        if (invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invite has expired');
        const existing = await this.usersService.findByEmail(invite.email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const [user] = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    orgId: invite.orgId,
                    role: client_1.Role.TENANT,
                    name: invite.name,
                    email: invite.email,
                    password: hashedPassword,
                },
            });
            await tx.unit.update({
                where: { id: invite.unitId },
                data: { tenantId: newUser.id },
            });
            await tx.tenantInvite.update({
                where: { id: invite.id },
                data: { acceptedAt: new Date() },
            });
            return [newUser];
        });
        this.logger.log(`Tenant ${user.id} accepted invite and joined org ${user.orgId}`);
        const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
        await this.storeRefreshToken(user.id, tokens.refreshToken);
        return { user: this.sanitizeUser(user), ...tokens };
    }
    hashOtp(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    async forgotPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user)
            return { message: 'If an account exists, a code has been sent.' };
        const code = String(crypto.randomInt(100000, 999999));
        const hashedCode = this.hashOtp(code);
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { passwordResetCode: hashedCode, passwordResetExpiry: expiry },
        });
        try {
            await this.mailService.sendPasswordReset({
                to: user.email,
                name: user.name,
                code,
                language: user.language,
            });
        }
        catch (err) {
            this.logger.error(`Failed to send password reset email to ${user.email}: ${err.message}`);
        }
        return { message: 'If an account exists, a code has been sent.' };
    }
    async resetPassword(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user || !user.passwordResetCode || !user.passwordResetExpiry) {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        if (user.passwordResetExpiry < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired code');
        }
        const codeValid = this.hashOtp(dto.code) === user.passwordResetCode;
        if (!codeValid)
            throw new common_1.BadRequestException('Invalid or expired code');
        const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetCode: null,
                passwordResetExpiry: null,
                refreshToken: null,
            },
        });
        this.logger.log(`User ${user.id} reset their password`);
        return { message: 'Password reset successfully' };
    }
    async getInviteInfo(token) {
        const invite = await this.prisma.tenantInvite.findUnique({
            where: { token },
        });
        if (!invite)
            throw new common_1.NotFoundException('Invite not found');
        if (invite.expiresAt < new Date())
            throw new common_1.BadRequestException('Invite has expired');
        const org = await this.prisma.organisation.findUnique({ where: { id: invite.orgId } });
        return {
            email: invite.email,
            name: invite.name,
            orgName: org?.name ?? '',
            expiresAt: invite.expiresAt,
        };
    }
    async generateTokens(userId, email, name, role, orgId, language) {
        const payload = { sub: userId, email, name, role, orgId, language };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: (this.configService.get('JWT_EXPIRES_IN') ?? '1h'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: (this.configService.get('JWT_REFRESH_EXPIRES_IN') ?? '30d'),
            }),
        ]);
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, rawToken) {
        const hashed = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
        await this.usersService.updateRefreshToken(userId, hashed);
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            orgId: user.orgId,
            language: user.language,
            phone: user.phone,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map