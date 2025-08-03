import { Injectable } from '@nestjs/common';

@Injectable()
export class StravaService {
  async getAuthUrl() {
    // TODO: Generate Strava OAuth URL
    return { message: 'Generate Strava auth URL' };
  }

  async exchangeCode(code: string) {
    // TODO: Exchange code for access token
    return { message: `Exchange code: ${code}` };
  }

  async getActivities(accessToken: string) {
    // TODO: Fetch user activities from Strava
    return { message: 'Fetch activities from Strava API' };
  }
}