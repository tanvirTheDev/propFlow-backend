import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { MailService } from '@/modules/mail/mail.service';
import { NOTIFICATION_TYPES, resolveLink } from './notification-types';
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

interface QueuePayload {
  ticketId?: string;
  appointmentId?: string;
  messageId?: string;
  ticketTitle?: string;
  ticketNumber?: string;
  ticketCategory?: string;
  ticketPriority?: string;
  ticketDescription?: string;
  tenantName?: string;
  unitNumber?: string;
  propertyName?: string;
  senderName?: string;
  messagePreview?: string;
  scheduledAt?: string;
  durationMin?: number;
  address?: string;
  note?: string;
  reason?: string;
  cancelledBy?: string;
  cancelReason?: string;
  hoursUntil?: number;
  daysOpen?: number;
  visitId?: string;
  landlordName?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly vapidConfigured: boolean;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email = this.config.get<string>('VAPID_EMAIL');

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(email, publicKey, privateKey);
      this.vapidConfigured = true;
    } else {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
      this.vapidConfigured = false;
    }
  }

  async processEntry(entry: QueueEntry): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: entry.targetUserId },
      select: { id: true, email: true, name: true, language: true, pushSubscription: true },
    });
    if (!user) {
      this.logger.warn(`Target user ${entry.targetUserId} not found — skipping`);
      return;
    }

    const payload = entry.payload as QueuePayload;
    const meta = NOTIFICATION_TYPES[entry.type];
    const lang = user.language ?? 'de';
    const link = meta
      ? resolveLink(meta.linkPattern, { ticketId: payload.ticketId ?? '' })
      : '/';

    for (const channel of entry.channels) {
      if (channel === 'EMAIL') await this.sendEmail(user, entry.type, payload, lang);
      if (channel === 'PUSH') await this.sendPush(user, entry.type, lang, link);
    }

    await this.createInApp(entry.targetUserId, entry.orgId, entry.type, payload, lang, link);
  }

  private async sendEmail(
    user: { email: string; name: string },
    type: string,
    payload: QueuePayload,
    lang: string,
  ): Promise<void> {
    const ticketLink = `${this.frontendUrl}${payload.ticketId ? `/landlord/tickets/${payload.ticketId}` : ''}`;

    switch (type) {
      case 'TICKET_CREATED':
        await this.mail.sendTicketCreated({
          to: user.email,
          language: lang,
          tenantName: payload.tenantName ?? user.name,
          unitNumber: payload.unitNumber ?? '',
          propertyName: payload.propertyName ?? '',
          ticketTitle: payload.ticketTitle ?? '',
          ticketCategory: payload.ticketCategory ?? '',
          ticketPriority: payload.ticketPriority ?? 'NORMAL',
          description: payload.ticketDescription ?? '',
          ticketLink,
        });
        break;

      case 'MESSAGE_RECEIVED':
        await this.mail.sendMessageReceived({
          to: user.email,
          language: lang,
          senderName: payload.senderName ?? '',
          messagePreview: payload.messagePreview ?? '',
          ticketTitle: payload.ticketTitle ?? '',
          ticketLink,
        });
        break;

      case 'APPOINTMENT_SCHEDULED':
      case 'APPOINTMENT_RESCHEDULED':
        await this.mail.sendAppointmentScheduled({
          to: user.email,
          language: lang,
          ticketTitle: payload.ticketTitle ?? '',
          scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
          durationMin: payload.durationMin ?? 60,
          address: payload.address ?? '',
          note: payload.note,
          ticketLink,
        });
        break;

      case 'APPOINTMENT_REMINDER_24H':
      case 'APPOINTMENT_REMINDER_2H':
        await this.mail.sendAppointmentReminder({
          to: user.email,
          language: lang,
          ticketTitle: payload.ticketTitle ?? '',
          scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
          address: payload.address ?? '',
          hoursUntil: payload.hoursUntil ?? 24,
          ticketLink,
        });
        break;

      case 'APPOINTMENT_CANCELLED':
        await this.mail.sendAppointmentCancelled({
          to: user.email,
          language: lang,
          ticketTitle: payload.ticketTitle ?? '',
          scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
          cancelledBy: payload.cancelledBy ?? '',
          reason: payload.cancelReason,
          ticketLink,
        });
        break;

      case 'TICKET_PENDING_REMINDER':
        await this.mail.sendTicketPendingReminder({
          to: user.email,
          language: lang,
          ticketTitle: payload.ticketTitle ?? '',
          ticketNumber: payload.ticketNumber ?? '',
          daysOpen: payload.daysOpen ?? 3,
          tenantName: payload.tenantName ?? '',
          unitNumber: payload.unitNumber ?? '',
          ticketLink,
        });
        break;

      case 'VISIT_SCHEDULED': {
        const calendarLink = `${this.frontendUrl}/tenant/calendar`;
        await this.mail.sendVisitScheduled({
          to: user.email,
          language: lang,
          landlordName: payload.landlordName ?? '',
          propertyName: payload.propertyName ?? '',
          unitNumber: payload.unitNumber ?? '',
          scheduledAt: new Date(payload.scheduledAt ?? Date.now()),
          durationMin: payload.durationMin ?? 60,
          reason: payload.reason ?? '',
          note: payload.note,
          calendarLink,
        });
        break;
      }

      default:
        this.logger.warn(`No email handler for type: ${type}`);
    }
  }

  private async sendPush(
    user: { id: string; pushSubscription: string | null },
    type: string,
    lang: string,
    link: string,
  ): Promise<void> {
    if (!this.vapidConfigured || !user.pushSubscription) return;

    const meta = NOTIFICATION_TYPES[type];
    if (!meta || !meta.pushTitle) return; // null pushTitle = email-only type (e.g. VISIT_SCHEDULED)

    const isDE = lang === 'de';
    const pushData = {
      title: isDE ? meta.pushTitle.de : meta.pushTitle.en,
      body: isDE ? meta.inAppBody.de : meta.inAppBody.en,
      url: `${this.frontendUrl}${link}`,
      icon: '/icon-192x192.png',
    };

    try {
      const sub = JSON.parse(user.pushSubscription) as webpush.PushSubscription;
      await webpush.sendNotification(sub, JSON.stringify(pushData));
    } catch (err) {
      const webErr = err as { statusCode?: number };
      if (webErr.statusCode === 410) {
        // Subscription expired — clean it up
        await this.prisma.user.update({
          where: { id: user.id },
          data: { pushSubscription: null },
        });
        this.logger.log(`Push subscription removed for user ${user.id} (410 Gone)`);
      } else {
        throw err;
      }
    }
  }

  private async createInApp(
    userId: string,
    orgId: string,
    type: string,
    payload: QueuePayload,
    lang: string,
    link: string,
  ): Promise<void> {
    const meta = NOTIFICATION_TYPES[type];
    if (!meta) return;

    const isDE = lang === 'de';
    await this.prisma.inAppNotification.create({
      data: {
        orgId,
        userId,
        type,
        title: isDE ? meta.inAppTitle.de : meta.inAppTitle.en,
        body: isDE ? meta.inAppBody.de : meta.inAppBody.en,
        link,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }

  async savePushSubscription(userId: string, subscription: Record<string, unknown>): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: JSON.stringify(subscription) },
    });
  }

  async removePushSubscription(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: null },
    });
  }

  async listInApp(userId: string, dto: ListInAppDto) {
    return this.prisma.inAppNotification.findMany({
      where: {
        userId,
        ...(dto.unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: dto.limit ?? 20,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.inAppNotification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.inAppNotification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }
}
