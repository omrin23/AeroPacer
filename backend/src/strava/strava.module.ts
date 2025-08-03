import { Module } from '@nestjs/common';
import { StravaService } from './strava.service';
import { StravaController } from './strava.controller';

@Module({
  controllers: [StravaController],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule {}