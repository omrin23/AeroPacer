import { Controller, Post, Body } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() eventData: any) {
    return this.analyticsService.trackEvent(eventData);
  }

  @Post('page-view')
  async trackPageView(@Body() pageData: any) {
    return this.analyticsService.trackPageView(pageData);
  }
}