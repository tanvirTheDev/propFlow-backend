import type { JwtPayload } from "../auth/types/jwt-payload.type";
import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadTicketPhotos(files: Express.Multer.File[] | undefined, user: JwtPayload): Promise<{
        urls: string[];
    }>;
    uploadChatPhoto(file: Express.Multer.File, user: JwtPayload): Promise<{
        url: string;
    }>;
}
