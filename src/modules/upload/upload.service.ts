import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
];

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

  async uploadDocument(
    orgId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; fileType: string; fileSizeBytes: number; originalName: string }> {
    if (!ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed. Use PDF, JPG, PNG, WEBP or DOCX.`);
    }
    if (file.size > MAX_DOCUMENT_SIZE) {
      throw new BadRequestException(`File exceeds 20MB limit`);
    }

    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `propflow/${orgId}/documents`,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });

    return {
      url,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      originalName: file.originalname,
    };
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
