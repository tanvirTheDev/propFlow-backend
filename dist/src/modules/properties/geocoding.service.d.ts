export declare class GeocodingService {
    private readonly logger;
    private readonly USER_AGENT;
    geocode(street: string, city: string, postalCode: string, country: string): Promise<{
        latitude: number;
        longitude: number;
    } | null>;
}
