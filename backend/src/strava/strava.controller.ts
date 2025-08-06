import { Controller, Get, Post, Query, UseGuards, Request, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { StravaService } from './strava.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from '../activities/activities.service';

@Controller('strava')
export class StravaController {
  constructor(
    private readonly stravaService: StravaService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Request() req) {
    return this.stravaService.getAuthUrl(req.user.id);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (error) {
      return res.redirect(`${frontendUrl}/dashboard?strava_error=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/dashboard?strava_error=missing_params`);
    }

    try {
      const userId = state; // We used userId as state
      await this.stravaService.exchangeCodeForToken(code, userId);
      
      // Automatically sync activities after successful OAuth connection
      try {
        console.log('Starting automatic activity sync for user:', userId);
        await this.stravaService.syncUserActivities(userId);
        console.log('Automatic activity sync completed successfully');
      } catch (syncError) {
        console.error('Auto-sync failed (non-critical):', syncError.message);
        // Don't fail the OAuth flow if sync fails
      }
      
      return res.redirect(`${frontendUrl}/dashboard?strava_success=true`);
    } catch (error) {
      console.error('Strava callback error:', error.message);
      return res.redirect(`${frontendUrl}/dashboard?strava_error=connection_failed`);
    }
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncActivities(@Request() req) {
    return this.stravaService.syncUserActivities(req.user.id);
  }

  @Post('sync/extended')
  @UseGuards(JwtAuthGuard)
  async syncActivitiesExtended(@Request() req, @Query('months') months?: string) {
    const monthsBack = months ? parseInt(months, 10) : 12;
    return this.stravaService.syncUserActivitiesExtended(req.user.id, monthsBack);
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@Request() req) {
    return this.stravaService.disconnectStrava(req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getConnectionStatus(@Request() req) {
    try {
      const status = await this.stravaService.getConnectionStatus(req.user.id);
      return status;
    } catch (error) {
      return { connected: false, message: 'Strava is not connected' };
    }
  }

  @Get('activities')
  @UseGuards(JwtAuthGuard)
  async getUserActivities(@Request() req) {
    // Return activities from our database (synced from Strava)
    return this.activitiesService.getRecentActivities(req.user.id, 10);
  }
}