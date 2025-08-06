import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import { AuthToken } from '../entities/auth-token.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile: string;
    // ... other athlete fields
  };
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  map?: {
    summary_polyline: string;
  };
  splits_metric?: Array<{
    distance: number;
    elapsed_time: number;
    elevation_difference: number;
    moving_time: number;
    split: number;
    average_speed: number;
  }>;
}

@Injectable()
export class StravaService {
  private readonly stravaApiUrl = 'https://www.strava.com/api/v3';
  private readonly stravaOAuthUrl = 'https://www.strava.com/oauth';

  constructor(
    @InjectRepository(AuthToken)
    private authTokenRepository: Repository<AuthToken>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async getAuthUrl(userId: string): Promise<{ authUrl: string }> {
    const clientId = this.configService.get<string>('STRAVA_CLIENT_ID');
    const redirectUri = this.configService.get<string>('STRAVA_REDIRECT_URI');
    
    if (!clientId || !redirectUri) {
      throw new InternalServerErrorException('Strava configuration missing');
    }

    const scope = 'read,activity:read_all,profile:read_all';
    const state = userId; // Use userId as state for security
    
    const authUrl = `${this.stravaOAuthUrl}/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `approval_prompt=force&` +
      `scope=${scope}&` +
      `state=${state}`;

    return { authUrl };
  }

  async exchangeCodeForToken(code: string, userId: string): Promise<{ success: boolean; message: string }> {
    const clientId = this.configService.get<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('STRAVA_CLIENT_SECRET');

    try {
      const response = await axios.post<StravaTokenResponse>(`${this.stravaOAuthUrl}/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      });

      const tokenData = response.data;

      // Store the token in database
      await this.storeStravaToken(userId, tokenData);

      // Update user's Strava ID
      await this.usersService.updateStravaConnection(userId, tokenData.athlete.id.toString());

      return {
        success: true,
        message: 'Successfully connected to Strava',
      };
    } catch (error) {
      console.error('Error exchanging Strava code:', error.response?.data || error.message);
      throw new BadRequestException('Failed to connect to Strava');
    }
  }

  async refreshStravaToken(userId: string): Promise<void> {
    const authToken = await this.authTokenRepository.findOne({
      where: { userId, provider: 'strava', isActive: true },
    });

    if (!authToken || !authToken.refreshToken) {
      throw new NotFoundException('No valid Strava token found');
    }

    const clientId = this.configService.get<string>('STRAVA_CLIENT_ID');
    const clientSecret = this.configService.get<string>('STRAVA_CLIENT_SECRET');

    try {
      const response = await axios.post<StravaTokenResponse>(`${this.stravaOAuthUrl}/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: authToken.refreshToken,
        grant_type: 'refresh_token',
      });

      const tokenData = response.data;
      
      // Update the existing token
      await this.authTokenRepository.update(authToken.id, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(tokenData.expires_at * 1000),
        providerData: tokenData as Record<string, any>,
      });
    } catch (error) {
      console.error('Error refreshing Strava token:', error.response?.data || error.message);
      throw new BadRequestException('Failed to refresh Strava token');
    }
  }

  async getValidStravaToken(userId: string): Promise<string> {
    const authToken = await this.authTokenRepository.findOne({
      where: { userId, provider: 'strava', isActive: true },
    });

    if (!authToken) {
      throw new NotFoundException('No Strava connection found');
    }

    // Check if token is expired
    if (authToken.isExpired) {
      await this.refreshStravaToken(userId);
      
      // Fetch the updated token
      const updatedToken = await this.authTokenRepository.findOne({
        where: { userId, provider: 'strava', isActive: true },
      });
      
      return updatedToken.accessToken;
    }

    return authToken.accessToken;
  }

  async syncUserActivities(userId: string): Promise<{ synced: number; message: string }> {
    const accessToken = await this.getValidStravaToken(userId);
    
    try {
      // Get activities from last 6 months (180 days) to support historical data
      const perPage = 200; // Increased to get more activities per request
      const afterDate = Math.floor((Date.now() - 180 * 24 * 60 * 60 * 1000) / 1000); // 180 days ago
      
      let allActivities: StravaActivity[] = [];
      let page = 1;
      let hasMorePages = true;
      
      // Fetch all pages of activities
      while (hasMorePages) {
        const response = await axios.get<StravaActivity[]>(`${this.stravaApiUrl}/athlete/activities`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            per_page: perPage,
            page: page,
            after: afterDate,
          },
        });

        const activities = response.data;
        if (activities.length === 0) {
          hasMorePages = false;
        } else {
          allActivities = allActivities.concat(activities);
          page++;
          
          // Limit to prevent infinite loops (max 5 pages = 1000 activities)
          if (page > 5) {
            hasMorePages = false;
          }
        }
      }

      let syncedCount = 0;

      for (const stravaActivity of allActivities) {
        // Check if activity already exists
        const existingActivity = await this.activityRepository.findOne({
          where: { userId, stravaId: stravaActivity.id.toString() },
        });

        if (!existingActivity && stravaActivity.type === 'Run') {
          await this.createActivityFromStrava(userId, stravaActivity);
          syncedCount++;
        }
      }

      return {
        synced: syncedCount,
        message: `Successfully synced ${syncedCount} new activities from ${allActivities.length} total activities`,
      };
    } catch (error) {
      console.error('Error syncing Strava activities:', error.response?.data || error.message);
      throw new BadRequestException('Failed to sync activities from Strava');
    }
  }

  async getConnectionStatus(userId: string): Promise<any> {
    try {
      const authToken = await this.authTokenRepository.findOne({
        where: { userId, provider: 'strava', isActive: true },
      });

      if (!authToken) {
        return { connected: false, message: 'Strava is not connected' };
      }

      // Get athlete information from stored token data
      const athleteData = authToken.providerData?.athlete;
      if (athleteData) {
        return {
          connected: true,
          message: 'Strava is connected',
          athleteName: `${athleteData.firstname} ${athleteData.lastname}`.trim(),
          athleteId: athleteData.id,
          profile: athleteData.profile,
          lastSyncAt: authToken.updatedAt,
        };
      }

      // If no athlete data stored, try to fetch it from Strava API
      try {
        const accessToken = await this.getValidStravaToken(userId);
        const response = await axios.get(`${this.stravaApiUrl}/athlete`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const athlete = response.data;
        
        // Update the token with athlete data for future use
        await this.authTokenRepository.update(authToken.id, {
          providerData: {
            ...authToken.providerData,
            athlete,
          },
        });

        return {
          connected: true,
          message: 'Strava is connected',
          athleteName: `${athlete.firstname} ${athlete.lastname}`.trim(),
          athleteId: athlete.id,
          profile: athlete.profile,
          lastSyncAt: authToken.updatedAt,
        };
      } catch (apiError) {
        console.error('Failed to fetch athlete data from Strava:', apiError);
        return {
          connected: true,
          message: 'Strava is connected (limited info)',
          lastSyncAt: authToken.updatedAt,
        };
      }
    } catch (error) {
      throw new NotFoundException('No Strava connection found');
    }
  }

  async syncUserActivitiesExtended(userId: string, monthsBack: number = 12): Promise<{ synced: number; message: string }> {
    const accessToken = await this.getValidStravaToken(userId);
    
    try {
      // Get activities from specified months back (default 12 months)
      const perPage = 200;
      const afterDate = Math.floor((Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000) / 1000);
      
      let allActivities: StravaActivity[] = [];
      let page = 1;
      let hasMorePages = true;
      
      // Fetch all pages of activities
      while (hasMorePages) {
        const response = await axios.get<StravaActivity[]>(`${this.stravaApiUrl}/athlete/activities`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            per_page: perPage,
            page: page,
            after: afterDate,
          },
        });

        const activities = response.data;
        if (activities.length === 0) {
          hasMorePages = false;
        } else {
          allActivities = allActivities.concat(activities);
          page++;
          
          // Limit to prevent infinite loops (max 10 pages = 2000 activities)
          if (page > 10) {
            hasMorePages = false;
          }
        }
      }

      let syncedCount = 0;

      for (const stravaActivity of allActivities) {
        // Check if activity already exists
        const existingActivity = await this.activityRepository.findOne({
          where: { userId, stravaId: stravaActivity.id.toString() },
        });

        if (!existingActivity && stravaActivity.type === 'Run') {
          await this.createActivityFromStrava(userId, stravaActivity);
          syncedCount++;
        }
      }

      return {
        synced: syncedCount,
        message: `Successfully synced ${syncedCount} new activities from ${allActivities.length} total activities (${monthsBack} months back)`,
      };
    } catch (error) {
      console.error('Error syncing extended Strava activities:', error.response?.data || error.message);
      throw new BadRequestException('Failed to sync extended activities from Strava');
    }
  }

  async disconnectStrava(userId: string): Promise<{ success: boolean; message: string }> {
    // Deactivate all Strava tokens for this user
    await this.authTokenRepository.update(
      { userId, provider: 'strava' },
      { isActive: false }
    );

    // Remove Strava ID from user
    await this.userRepository.update(userId, { stravaId: null });

    return {
      success: true,
      message: 'Successfully disconnected from Strava',
    };
  }

  private async storeStravaToken(userId: string, tokenData: StravaTokenResponse): Promise<void> {
    // Deactivate any existing Strava tokens
    await this.authTokenRepository.update(
      { userId, provider: 'strava' },
      { isActive: false }
    );

    // Create new token record
    const authToken = this.authTokenRepository.create({
      userId,
      provider: 'strava',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenType: tokenData.token_type,
      scope: 'read,activity:read_all,profile:read_all',
      expiresAt: new Date(tokenData.expires_at * 1000),
      providerData: tokenData as Record<string, any>,
      isActive: true,
    });

    await this.authTokenRepository.save(authToken);
  }

  private async createActivityFromStrava(userId: string, stravaActivity: StravaActivity): Promise<void> {
    // Convert Strava data to our Activity format
    const activity = this.activityRepository.create({
      userId,
      stravaId: stravaActivity.id.toString(),
      name: stravaActivity.name,
      type: stravaActivity.type,
      distance: stravaActivity.distance, // meters
      duration: stravaActivity.moving_time, // seconds
      averagePace: stravaActivity.average_speed ? this.speedToPace(stravaActivity.average_speed) : null,
      maxPace: stravaActivity.max_speed ? this.speedToPace(stravaActivity.max_speed) : null,
      elevationGain: stravaActivity.total_elevation_gain,
      averageHeartRate: stravaActivity.average_heartrate,
      maxHeartRate: stravaActivity.max_heartrate,
      averageCadence: stravaActivity.average_cadence,
      startDate: new Date(stravaActivity.start_date),
      startLatitude: stravaActivity.start_latlng?.[0],
      startLongitude: stravaActivity.start_latlng?.[1],
      endLatitude: stravaActivity.end_latlng?.[0],
      endLongitude: stravaActivity.end_latlng?.[1],
      polyline: stravaActivity.map ? {
        summary: stravaActivity.map.summary_polyline,
      } : null,
      splits: stravaActivity.splits_metric?.map(split => ({
        distance: split.distance,
        time: split.moving_time,
        pace: this.speedToPace(split.average_speed),
      })),
      stravaData: stravaActivity, // Store raw Strava data
    });

    await this.activityRepository.save(activity);
  }

  private speedToPace(speed: number): number {
    // Convert m/s to pace (seconds per km)
    if (speed <= 0) return 0;
    return 1000 / speed; // seconds per km
  }
}