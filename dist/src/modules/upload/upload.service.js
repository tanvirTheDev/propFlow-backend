"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
let UploadService = class UploadService {
    constructor(config) {
        this.config = config;
        cloudinary_1.v2.config({
            cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
            api_key: this.config.get('CLOUDINARY_API_KEY'),
            api_secret: this.config.get('CLOUDINARY_API_SECRET'),
        });
    }
    async uploadTicketPhotos(orgId, files) {
        if (!files.length)
            return [];
        return this.uploadFiles(files, `propflow/${orgId}/tickets`);
    }
    async uploadChatPhoto(orgId, file) {
        const [url] = await this.uploadFiles([file], `propflow/${orgId}/chat`);
        return url;
    }
    async uploadFiles(files, folder) {
        for (const file of files) {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                throw new common_1.BadRequestException(`File type ${file.mimetype} is not allowed`);
            }
            if (file.size > MAX_FILE_SIZE) {
                throw new common_1.BadRequestException(`File ${file.originalname} exceeds 5MB limit`);
            }
        }
        return Promise.all(files.map((file) => new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({ folder, resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'] }, (error, result) => {
                if (error || !result)
                    return reject(error ?? new Error('Upload failed'));
                resolve(result.secure_url);
            });
            stream.end(file.buffer);
        })));
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map