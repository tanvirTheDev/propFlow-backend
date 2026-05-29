import { Module } from '@nestjs/common';
// import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
// import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { PropertiesModule } from '@/modules/properties/properties.module';
import { UnitsModule } from '@/modules/units/units.module';
import { InvitesModule } from '@/modules/invites/invites.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { TicketsModule } from '@/modules/tickets/tickets.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { AppointmentsModule } from '@/modules/appointments/appointments.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { HealthModule } from '@/modules/health/health.module';
import { VisitsModule } from '@/modules/visits/visits.module';
import { validate } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    // ThrottlerModule.forRoot([
    //   { name: 'global', ttl: 60000, limit: 100 },
    //   { name: 'auth', ttl: 60000, limit: 5 },
    // ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    InvitesModule,
    DashboardModule,
    TicketsModule,
    UploadModule,
    ChatModule,
    AppointmentsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
    VisitsModule,
  ],
  providers: [
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
