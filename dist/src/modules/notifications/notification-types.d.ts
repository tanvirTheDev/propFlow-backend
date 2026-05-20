export interface NotificationTypeMeta {
    emailTemplate: string;
    pushTitle: {
        en: string;
        de: string;
    };
    inAppTitle: {
        en: string;
        de: string;
    };
    inAppBody: {
        en: string;
        de: string;
    };
    linkPattern: string;
}
export declare const NOTIFICATION_TYPES: Record<string, NotificationTypeMeta>;
export declare function resolveLink(pattern: string, payload: Record<string, string>): string;
