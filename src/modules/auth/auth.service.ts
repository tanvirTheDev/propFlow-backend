import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '@/modules/users/users.service';
import { MailService } from '@/modules/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './types/jwt-payload.type';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const [org, user] = await this.prisma.$transaction(async (tx) => {
      const organisation = await tx.organisation.create({
        data: { name: dto.organisationName },
      });

      const newUser = await tx.user.create({
        data: {
          orgId: organisation.id,
          role: Role.LANDLORD,
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

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new ForbiddenException('Your account has been deactivated. Contact support.');

    this.logger.log(`User ${user.id} logged in`);
    const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(userId: string, rawRefreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException('Access denied');

    const tokenValid = await bcrypt.compare(rawRefreshToken, user.refreshToken);
    if (!tokenValid) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user.id, user.email, user.name, user.role, user.orgId, user.language);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async acceptInvite(dto: AcceptInviteDto) {
    const invite = await this.prisma.tenantInvite.findUnique({
      where: { token: dto.token },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');

    const existing = await this.usersService.findByEmail(invite.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const [user] = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          orgId: invite.orgId,
          role: Role.TENANT,
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

  // SHA-256 hash for short-lived OTPs — instant, unlike bcrypt which is
  // CPU-bound and too slow for low-resource environments (Render free 0.1 CPU).
  private hashOtp(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Always return success to prevent user enumeration
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return { message: 'If an account exists, a code has been sent.' };

    const code = String(crypto.randomInt(100000, 999999));
    const hashedCode = this.hashOtp(code); // instant — no bcrypt on hot path
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

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
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${user.email}: ${(err as Error).message}`);
    }

    return { message: 'If an account exists, a code has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordResetCode || !user.passwordResetExpiry) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    const codeValid = this.hashOtp(dto.code) === user.passwordResetCode;
    if (!codeValid) throw new BadRequestException('Invalid or expired code');

    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetCode: null,
        passwordResetExpiry: null,
        // Invalidate all existing sessions
        refreshToken: null,
      },
    });

    this.logger.log(`User ${user.id} reset their password`);
    return { message: 'Password reset successfully' };
  }

  async getInviteInfo(token: string) {
    const invite = await this.prisma.tenantInvite.findUnique({
      where: { token },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.expiresAt < new Date()) throw new BadRequestException('Invite has expired');

    const org = await this.prisma.organisation.findUnique({ where: { id: invite.orgId } });

    return {
      email: invite.email,
      name: invite.name,
      orgName: org?.name ?? '',
      expiresAt: invite.expiresAt,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    role: Role,
    orgId: string,
    language: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { sub: userId, email, name, role, orgId, language };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ?? '1h') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d') as StringValue,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const hashed = await bcrypt.hash(rawToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshToken(userId, hashed);
  }

  private sanitizeUser(user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    orgId: string;
    language: string;
    phone: string | null;
  }) {
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
}
