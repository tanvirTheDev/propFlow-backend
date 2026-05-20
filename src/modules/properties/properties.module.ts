import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { GeocodingService } from './geocoding.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, GeocodingService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
