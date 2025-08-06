import { Controller, Get, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ActivitiesService, ActivityQuery } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getUserActivities(@Request() req, @Query() query: ActivityQuery) {
    return this.activitiesService.getUserActivities(req.user.id, query);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.activitiesService.getUserStats(req.user.id);
  }

  @Get('recent')
  async getRecentActivities(@Request() req, @Query('limit') limit?: string) {
    const activityLimit = limit ? parseInt(limit, 10) : 5;
    return this.activitiesService.getRecentActivities(req.user.id, activityLimit);
  }

  @Get(':id')
  async getActivity(@Request() req, @Param('id') id: string) {
    return this.activitiesService.getActivityById(req.user.id, id);
  }

  @Delete(':id')
  async deleteActivity(@Request() req, @Param('id') id: string) {
    return this.activitiesService.deleteActivity(req.user.id, id);
  }
}