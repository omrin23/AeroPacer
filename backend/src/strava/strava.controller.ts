import { Controller, Get, Query } from '@nestjs/common';
import { StravaService } from './strava.service';

@Controller('strava')
export class StravaController {
  constructor(private readonly stravaService: StravaService) {}

  @Get('connect')
  async connect() {
    return { message: 'Strava OAuth connection - coming soon' };
  }

  @Get('callback')
  async callback(@Query('code') code: string) {
    return { message: `Strava callback with code: ${code} - coming soon` };
  }

  @Get('activities')
  async getActivities() {
    return { message: 'Fetch Strava activities - coming soon' };
  }
}