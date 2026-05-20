"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TYPES = void 0;
exports.resolveLink = resolveLink;
exports.NOTIFICATION_TYPES = {
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
};
function resolveLink(pattern, payload) {
    return pattern.replace(/\{(\w+)\}/g, (_, key) => payload[key] ?? '');
}
//# sourceMappingURL=notification-types.js.map