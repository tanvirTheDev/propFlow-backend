export interface NotificationTypeMeta {
  emailTemplate: string;
  pushTitle: { en: string; de: string };
  inAppTitle: { en: string; de: string };
  inAppBody: { en: string; de: string };
  linkPattern: string;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeMeta> = {
  TICKET_CREATED: {
    emailTemplate: 'ticket-created',
    pushTitle: { en: 'New maintenance request', de: 'Neue Wartungsanfrage' },
    inAppTitle: { en: 'New ticket submitted', de: 'Neues Ticket erstellt' },
    inAppBody: { en: 'A new ticket has been submitted', de: 'Ein neues Ticket wurde erstellt' },
    linkPattern: '/landlord/tickets/{ticketId}',
  },
  MESSAGE_RECEIVED: {
    emailTemplate: 'message-received',
    pushTitle: { en: 'New message', de: 'Neue Nachricht' },
    inAppTitle: { en: 'New message received', de: 'Neue Nachricht erhalten' },
    inAppBody: { en: 'You have a new message', de: 'Sie haben eine neue Nachricht' },
    linkPattern: '/landlord/tickets/{ticketId}',
  },
  APPOINTMENT_SCHEDULED: {
    emailTemplate: 'appointment-scheduled',
    pushTitle: { en: 'Appointment confirmed', de: 'Termin bestätigt' },
    inAppTitle: { en: 'Appointment scheduled', de: 'Termin vereinbart' },
    inAppBody: { en: 'An appointment has been scheduled', de: 'Ein Termin wurde vereinbart' },
    linkPattern: '/tenant/tickets/{ticketId}',
  },
  APPOINTMENT_REMINDER_24H: {
    emailTemplate: 'appointment-reminder',
    pushTitle: { en: 'Appointment in 24 hours', de: 'Termin in 24 Stunden' },
    inAppTitle: { en: 'Appointment reminder', de: 'Terminerinnerung' },
    inAppBody: { en: 'Your appointment is tomorrow', de: 'Ihr Termin ist morgen' },
    linkPattern: '/tenant/tickets/{ticketId}',
  },
  APPOINTMENT_REMINDER_2H: {
    emailTemplate: 'appointment-reminder',
    pushTitle: { en: 'Appointment in 2 hours', de: 'Termin in 2 Stunden' },
    inAppTitle: { en: 'Appointment reminder', de: 'Terminerinnerung' },
    inAppBody: { en: 'Your appointment is in 2 hours', de: 'Ihr Termin ist in 2 Stunden' },
    linkPattern: '/tenant/tickets/{ticketId}',
  },
  APPOINTMENT_RESCHEDULED: {
    emailTemplate: 'appointment-scheduled',
    pushTitle: { en: 'Appointment rescheduled', de: 'Termin neu terminiert' },
    inAppTitle: { en: 'Appointment rescheduled', de: 'Termin neu terminiert' },
    inAppBody: { en: 'Your appointment has been rescheduled', de: 'Ihr Termin wurde neu terminiert' },
    linkPattern: '/tenant/tickets/{ticketId}',
  },
  APPOINTMENT_CANCELLED: {
    emailTemplate: 'appointment-cancelled',
    pushTitle: { en: 'Appointment cancelled', de: 'Termin abgesagt' },
    inAppTitle: { en: 'Appointment cancelled', de: 'Termin abgesagt' },
    inAppBody: { en: 'An appointment has been cancelled', de: 'Ein Termin wurde abgesagt' },
    linkPattern: '/tenant/tickets/{ticketId}',
  },
  TICKET_PENDING_REMINDER: {
    emailTemplate: 'ticket-pending-reminder',
    pushTitle: { en: 'Ticket needs attention', de: 'Ticket benötigt Aufmerksamkeit' },
    inAppTitle: { en: 'Ticket needs attention', de: 'Ticket benötigt Aufmerksamkeit' },
    inAppBody: { en: 'A ticket has been open for 3+ days', de: 'Ein Ticket ist seit 3+ Tagen offen' },
    linkPattern: '/landlord/tickets/{ticketId}',
  },
  VISIT_SCHEDULED: {
    emailTemplate: 'visit-scheduled',
    pushTitle: null as unknown as { en: string; de: string }, // email only
    inAppTitle: { en: 'Landlord visit scheduled', de: 'Vermieterbesuch geplant' },
    inAppBody: { en: 'Your landlord has scheduled a visit', de: 'Ihr Vermieter hat einen Besuch geplant' },
    linkPattern: '/tenant/calendar',
  },
  LEASE_EXPIRING_90D: {
    emailTemplate: 'lease-expiring',
    pushTitle: null as unknown as { en: string; de: string },
    inAppTitle: { en: 'Lease expiring in 90 days', de: 'Mietvertrag läuft in 90 Tagen ab' },
    inAppBody: { en: 'A lease is expiring soon — 90 days left', de: 'Ein Mietvertrag läuft in 90 Tagen ab' },
    linkPattern: '/landlord/leases',
  },
  LEASE_EXPIRING_60D: {
    emailTemplate: 'lease-expiring',
    pushTitle: null as unknown as { en: string; de: string },
    inAppTitle: { en: 'Lease expiring in 60 days', de: 'Mietvertrag läuft in 60 Tagen ab' },
    inAppBody: { en: 'A lease is expiring soon — 60 days left', de: 'Ein Mietvertrag läuft in 60 Tagen ab' },
    linkPattern: '/landlord/leases',
  },
  LEASE_EXPIRING_30D: {
    emailTemplate: 'lease-expiring',
    pushTitle: null as unknown as { en: string; de: string },
    inAppTitle: { en: 'Lease expiring in 30 days — action required', de: 'Mietvertrag läuft in 30 Tagen ab — Handlung erforderlich' },
    inAppBody: { en: 'A lease expires in 30 days — renew or terminate', de: 'Ein Mietvertrag läuft in 30 Tagen ab' },
    linkPattern: '/landlord/leases',
  },
};

export function resolveLink(pattern: string, payload: Record<string, string>): string {
  return pattern.replace(/\{(\w+)\}/g, (_, key) => payload[key] ?? '');
}
