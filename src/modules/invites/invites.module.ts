import { Module } from '@nestjs/common';
import { MailModule } from '@/modules/mail/mail.module';
import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

@Module({
  imports: [MailModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
