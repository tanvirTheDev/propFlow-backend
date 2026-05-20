import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const BRAND_COLOR = '#1d4ed8';

function layout(body: string): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111827">
      <div style="margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
        <span style="font-size:18px;font-weight:700;color:${BRAND_COLOR}">PropFlow</span>
      </div>
      ${body}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af">
        PropFlow — Property Management
      </div>
    </div>
  `;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px">${label}</a>`;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    this.fromAddress = `PropFlow <${this.config.get('MAIL_FROM')}>`;
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: this.config.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.fromAddress, to, subject, html });
      this.logger.log(`Email sent: [${subject}]`);
    } catch (err) {
      this.logger.error(`Email failed: [${subject}] — ${(err as Error).message}`);
      throw err;
    }
  }

  async sendTenantInvite(opts: {
    to: string;
    name: string;
    orgName: string;
    inviteLink: string;
    expiresAt: Date;
    language?: string;
  }) {
    const isDE = opts.language === 'de';
    const expiryDate = opts.expiresAt.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const subject = isDE
      ? `Einladung von ${opts.orgName} — PropFlow`
      : `Invitation from ${opts.orgName} — PropFlow`;
    const html = layout(`
      <h1 style="font-size:22px;font-weight:700;margin-bottom:8px">${isDE ? 'Sie wurden eingeladen' : 'You have been invited'}</h1>
      <p style="color:#6b7280;margin-bottom:24px">${isDE ? 'Hallo' : 'Hi'} ${opts.name},</p>
      <p style="margin-bottom:8px"><strong>${opts.orgName}</strong> ${isDE ? 'hat Sie eingeladen.' : 'has invited you.'}</p>
      <p style="margin-bottom:24px;color:#6b7280">${isDE ? 'Ablaufdatum' : 'Expires'}: <strong>${expiryDate}</strong>.</p>
      ${ctaButton(isDE ? 'Einladung annehmen' : 'Accept Invitation', opts.inviteLink)}
      <p style="margin-top:24px;font-size:13px;color:#9ca3af">
        <a href="${opts.inviteLink}" style="color:${BRAND_COLOR};word-break:break-all">${opts.inviteLink}</a>
      </p>
    `);
    await this.send(opts.to, subject, html);
  }

  async sendTicketCreated(opts: {
    to: string;
    language: string;
    tenantName: string;
    unitNumber: string;
    propertyName: string;
    ticketTitle: string;
    ticketCategory: string;
    ticketPriority: string;
    description: string;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const priorityColor =
      opts.ticketPriority === 'URGENT' ? '#dc2626' :
      opts.ticketPriority === 'NORMAL' ? '#2563eb' : '#6b7280';
    const subject = isDE
      ? `Neue Wartungsanfrage von ${opts.tenantName}`
      : `New maintenance request from ${opts.tenantName}`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${isDE ? 'Neue Wartungsanfrage' : 'New Maintenance Request'}</h1>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Mieter' : 'Tenant'}:</strong> ${opts.tenantName}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Einheit' : 'Unit'}:</strong> ${opts.unitNumber} — ${opts.propertyName}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Titel' : 'Title'}:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Kategorie' : 'Category'}:</strong> ${opts.ticketCategory}</p>
      <p style="margin-bottom:16px">
        <strong>${isDE ? 'Priorität' : 'Priority'}:</strong>
        <span style="display:inline-block;background:${priorityColor};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">${opts.ticketPriority}</span>
      </p>
      <p style="margin-bottom:24px;color:#374151;background:#f9fafb;padding:12px;border-radius:6px;border-left:3px solid ${BRAND_COLOR}">${opts.description.slice(0, 300)}${opts.description.length > 300 ? '…' : ''}</p>
      ${ctaButton(isDE ? 'Ticket ansehen' : 'View Ticket', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }

  async sendMessageReceived(opts: {
    to: string;
    language: string;
    senderName: string;
    messagePreview: string;
    ticketTitle: string;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const subject = isDE
      ? `Neue Nachricht von ${opts.senderName}`
      : `New message from ${opts.senderName}`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${subject}</h1>
      <p style="margin-bottom:8px"><strong>Ticket:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:24px;color:#374151;background:#f9fafb;padding:12px;border-radius:6px;font-style:italic">"${opts.messagePreview.slice(0, 200)}${opts.messagePreview.length > 200 ? '…' : ''}"</p>
      ${ctaButton(isDE ? 'Jetzt antworten' : 'Reply Now', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }

  async sendAppointmentScheduled(opts: {
    to: string;
    language: string;
    ticketTitle: string;
    scheduledAt: Date;
    durationMin: number;
    address: string;
    note?: string;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const dateStr = opts.scheduledAt.toLocaleDateString(isDE ? 'de-DE' : 'en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const timeStr = opts.scheduledAt.toLocaleTimeString(isDE ? 'de-DE' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
    const subject = isDE
      ? `Termin bestätigt: ${dateStr}`
      : `Appointment confirmed: ${dateStr}`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${isDE ? 'Termin bestätigt' : 'Appointment Confirmed'}</h1>
      <p style="margin-bottom:8px"><strong>Ticket:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Datum' : 'Date'}:</strong> ${dateStr}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Uhrzeit' : 'Time'}:</strong> ${timeStr}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Dauer' : 'Duration'}:</strong> ${opts.durationMin} ${isDE ? 'Minuten' : 'minutes'}</p>
      <p style="margin-bottom:${opts.note ? '8px' : '24px'}"><strong>${isDE ? 'Adresse' : 'Address'}:</strong> ${opts.address}</p>
      ${opts.note ? `<p style="margin-bottom:24px;color:#374151;background:#f9fafb;padding:12px;border-radius:6px">${opts.note}</p>` : ''}
      ${ctaButton(isDE ? 'Details ansehen' : 'View Details', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }

  async sendAppointmentReminder(opts: {
    to: string;
    language: string;
    ticketTitle: string;
    scheduledAt: Date;
    address: string;
    hoursUntil: number;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const timeLabel = opts.hoursUntil <= 2
      ? (isDE ? 'in 2 Stunden' : 'in 2 hours')
      : (isDE ? 'in 24 Stunden' : 'in 24 hours');
    const dateStr = opts.scheduledAt.toLocaleDateString(isDE ? 'de-DE' : 'en-GB', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
    const timeStr = opts.scheduledAt.toLocaleTimeString(isDE ? 'de-DE' : 'en-GB', {
      hour: '2-digit', minute: '2-digit',
    });
    const subject = isDE
      ? `Erinnerung: Termin ${timeLabel}`
      : `Reminder: Appointment ${timeLabel}`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${isDE ? 'Terminerinnerung' : 'Appointment Reminder'}</h1>
      <p style="margin-bottom:16px;font-size:16px;color:#374151">${isDE ? 'Ihr Termin findet statt' : 'Your appointment is'} <strong>${timeLabel}</strong>.</p>
      <p style="margin-bottom:8px"><strong>Ticket:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Datum' : 'Date'}:</strong> ${dateStr} ${isDE ? 'um' : 'at'} ${timeStr}</p>
      <p style="margin-bottom:24px"><strong>${isDE ? 'Adresse' : 'Address'}:</strong> ${opts.address}</p>
      ${ctaButton(isDE ? 'Details ansehen' : 'View Details', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }

  async sendAppointmentCancelled(opts: {
    to: string;
    language: string;
    ticketTitle: string;
    scheduledAt: Date;
    cancelledBy: string;
    reason?: string;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const dateStr = opts.scheduledAt.toLocaleDateString(isDE ? 'de-DE' : 'en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const subject = isDE
      ? `Termin abgesagt — ${dateStr}`
      : `Appointment cancelled — ${dateStr}`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${isDE ? 'Termin abgesagt' : 'Appointment Cancelled'}</h1>
      <p style="margin-bottom:8px"><strong>Ticket:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Datum war' : 'Was scheduled'}:</strong> ${dateStr}</p>
      <p style="margin-bottom:${opts.reason ? '8px' : '24px'}"><strong>${isDE ? 'Abgesagt von' : 'Cancelled by'}:</strong> ${opts.cancelledBy}</p>
      ${opts.reason ? `<p style="margin-bottom:24px;color:#374151;background:#fef9c3;padding:12px;border-radius:6px"><strong>${isDE ? 'Grund' : 'Reason'}:</strong> ${opts.reason}</p>` : ''}
      ${ctaButton(isDE ? 'Ticket ansehen' : 'View Ticket', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }

  async sendTicketPendingReminder(opts: {
    to: string;
    language: string;
    ticketTitle: string;
    ticketNumber: string;
    daysOpen: number;
    tenantName: string;
    unitNumber: string;
    ticketLink: string;
  }) {
    const isDE = opts.language === 'de';
    const subject = isDE
      ? `Ticket benötigt Aufmerksamkeit — ${opts.daysOpen} Tage offen`
      : `Ticket needs attention — ${opts.daysOpen} days open`;
    const html = layout(`
      <h1 style="font-size:20px;font-weight:700;margin-bottom:16px">${isDE ? 'Ticket benötigt Aufmerksamkeit' : 'Ticket Needs Attention'}</h1>
      <p style="margin-bottom:16px;color:#374151">${isDE ? 'Dieses Ticket ist seit' : 'This ticket has been open for'} <strong>${opts.daysOpen} ${isDE ? 'Tagen' : 'days'}</strong> ${isDE ? 'offen.' : 'without an update.'}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Ticket-Nr.' : 'Ticket #'}:</strong> ${opts.ticketNumber}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Titel' : 'Title'}:</strong> ${opts.ticketTitle}</p>
      <p style="margin-bottom:8px"><strong>${isDE ? 'Mieter' : 'Tenant'}:</strong> ${opts.tenantName}</p>
      <p style="margin-bottom:24px"><strong>${isDE ? 'Einheit' : 'Unit'}:</strong> ${opts.unitNumber}</p>
      ${ctaButton(isDE ? 'Ticket ansehen' : 'View Ticket', opts.ticketLink)}
    `);
    await this.send(opts.to, subject, html);
  }
}
