import { Injectable, Logger } from '@nestjs/common';

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly USER_AGENT =
    'PropFlow-PropertyManagement/1.0 (contact@propflow.dev)';

  async geocode(
    street: string,
    city: string,
    postalCode: string,
    country: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    const query = `${street}, ${postalCode} ${city}, ${country}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        this.logger.warn(`Nominatim returned ${res.status} for query: ${query}`);
        return null;
      }

      const results: NominatimResult[] = await res.json();
      if (!results.length) {
        this.logger.warn(`No geocoding result for: ${query}`);
        return null;
      }

      return {
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      };
    } catch (err) {
      this.logger.error(`Geocoding failed for query "${query}": ${err}`);
      return null;
    }
  }
}
