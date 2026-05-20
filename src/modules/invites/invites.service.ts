import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private expiresAt(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  async findAll(orgId: string) {
    return this.prisma.tenantInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(orgId: string, dto: CreateInviteDto) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: dto.unitId, orgId },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit.tenantId) throw new ConflictException('Unit already has an active tenant');

    const pending = await this.prisma.tenantInvite.findFirst({
      where: { unitId: dto.unitId, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pending) throw new ConflictException('A pending invite already exists for this unit');

    const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });

    const token = this.generateToken();
    const expiresAt = this.expiresAt();
    this.logger.log(`Creating invite for unit ${dto.unitId} in org ${orgId}`);

    const invite = await this.prisma.tenantInvite.create({
      data: { orgId, unitId: dto.unitId, email: dto.email, name: dto.name, token, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    await this.mail.sendTenantInvite({
      to: dto.email,
      name: dto.name,
      orgName: org?.name ?? 'Your Landlord',
      inviteLink: `${frontendUrl}/invite/${token}`,
      expiresAt,
    });

    return invite;
  }

  async resend(id: string, orgId: string) {
    const invite = await this.prisma.tenantInvite.findFirst({ where: { id, orgId } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Invite already accepted');

    const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });

    const token = this.generateToken();
    const expiresAt = this.expiresAt();
    this.logger.log(`Resending invite ${id} for org ${orgId}`);

    const updated = await this.prisma.tenantInvite.update({
      where: { id },
      data: { token, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    await this.mail.sendTenantInvite({
      to: invite.email,
      name: invite.name,
      orgName: org?.name ?? 'Your Landlord',
      inviteLink: `${frontendUrl}/invite/${token}`,
      expiresAt,
    });

    return updated;
  }

  async cancel(id: string, orgId: string) {
    const invite = await this.prisma.tenantInvite.findFirst({ where: { id, orgId } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt) throw new BadRequestException('Cannot cancel an accepted invite');

    await this.prisma.tenantInvite.delete({ where: { id } });
    return { success: true };
  }
}
