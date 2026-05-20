import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadTicketPhotos(orgId: string, files: Express.Multer.File[]): Promise<string[]> {
    if (!files.length) return [];
    return this.uploadFiles(files, `propflow/${orgId}/tickets`);
  }

  async uploadChatPhoto(orgId: string, file: Express.Multer.File): Promise<string> {
    const [url] = await this.uploadFiles([file], `propflow/${orgId}/chat`);
    return url;
  }

  private async uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]> {
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(`File ${file.originalname} exceeds 5MB limit`);
      }
    }

    return Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder, resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'] },
              (error, result) => {
                if (error || !result) return reject(error ?? new Error('Upload failed'));
                resolve(result.secure_url);
              },
            );
            stream.end(file.buffer);
          }),
      ),
    );
  }
}
