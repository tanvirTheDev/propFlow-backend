import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { LeasesController } from './leases.controller';
import { LeasesService } from './leases.service';
import { LeasesCron } from './leases.cron';

@Module({
  imports: [PrismaModule],
  controllers: [LeasesController],
  providers: [LeasesService, LeasesCron],
  exports: [LeasesService],
})
export class LeasesModule {}
