import {
  BadRequestException,
  Controller,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/modules/auth/types/jwt-payload.type';
import { UploadService } from './upload.service';

@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('ticket-photos')
  @UseInterceptors(FilesInterceptor('files', 3, { storage: memoryStorage() }))
  async uploadTicketPhotos(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: false,
      }),
    )
    files: Express.Multer.File[] | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const uploaded = files ?? [];
    if (uploaded.length === 0) throw new BadRequestException('No files provided');
    const urls = await this.uploadService.uploadTicketPhotos(user.orgId, uploaded);
    return { urls };
  }

  @Post('chat-photo')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadChatPhoto(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    const url = await this.uploadService.uploadChatPhoto(user.orgId, file);
    return { url };
  }
}
