"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GeocodingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeocodingService = void 0;
const common_1 = require("@nestjs/common");
let GeocodingService = GeocodingService_1 = class GeocodingService {
    constructor() {
        this.logger = new common_1.Logger(GeocodingService_1.name);
        this.USER_AGENT = 'PropFlow-PropertyManagement/1.0 (contact@propflow.dev)';
    }
    async geocode(street, city, postalCode, country) {
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
            const results = await res.json();
            if (!results.length) {
                this.logger.warn(`No geocoding result for: ${query}`);
                return null;
            }
            return {
                latitude: parseFloat(results[0].lat),
                longitude: parseFloat(results[0].lon),
            };
        }
        catch (err) {
            this.logger.error(`Geocoding failed for query "${query}": ${err}`);
            return null;
        }
    }
};
exports.GeocodingService = GeocodingService;
exports.GeocodingService = GeocodingService = GeocodingService_1 = __decorate([
    (0, common_1.Injectable)()
], GeocodingService);
//# sourceMappingURL=geocoding.service.js.map