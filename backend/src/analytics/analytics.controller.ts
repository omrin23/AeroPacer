import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, PageViewDto, AnalyticsResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() eventData: TrackEventDto): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackEvent(eventData);
  }

  @Post('page-view')
  async trackPageView(@Body() pageData: PageViewDto): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackPageView(pageData);
  }

  @Get('metrics/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserMetrics(@Param('userId') userId: string, @Request() req) {
    // Ensure user can only access their own metrics
    if (req.user.id !== userId) {
      return { error: 'Unauthorized access to user metrics' };
    }
    return this.analyticsService.getUserMetrics(userId);
  }

  // Running-specific analytics endpoints
  @Post('workout/completed')
  @UseGuards(JwtAuthGuard)
  async trackWorkoutCompleted(@Body() workoutData: any, @Request() req): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackWorkoutCompleted(req.user.id, workoutData);
  }

  @Post('goal/achieved')
  @UseGuards(JwtAuthGuard)
  async trackGoalAchieved(@Body() goalData: any, @Request() req): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackGoalAchieved(req.user.id, goalData);
  }

  @Post('strava/sync')
  @UseGuards(JwtAuthGuard)
  async trackStravaSync(@Body() syncData: any, @Request() req): Promise<AnalyticsResponseDto> {
    return this.analyticsService.trackStravaSync(req.user.id, syncData);
  }
}