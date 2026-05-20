import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { MailModule } from '@/modules/mail/mail.module';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationQueueProcessor } from './notification-queue.processor';
import { ReminderCron } from './reminder.cron';

@Module({
  imports: [PrismaModule, MailModule],
  providers: [NotificationsService, NotificationQueueProcessor, ReminderCron],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
