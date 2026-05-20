import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly config;
    constructor(config: ConfigService);
    uploadTicketPhotos(orgId: string, files: Express.Multer.File[]): Promise<string[]>;
    uploadChatPhoto(orgId: string, file: Express.Multer.File): Promise<string>;
    private uploadFiles;
}
