import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Mixpanel from 'mixpanel';
import { TrackEventDto, PageViewDto, AnalyticsResponseDto, EventType } from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private mixpanel: Mixpanel.Mixpanel;

  constructor(private configService: ConfigService) {
    // Initialize Mixpanel
    const mixpanelToken = this.configService.get<string>('MIXPANEL_TOKEN');
    if (mixpanelToken) {
      this.mixpanel = Mixpanel.init(mixpanelToken);
      this.logger.log('Mixpanel initialized');
    } else {
      this.logger.warn('Mixpanel token not provided - analytics will be limited');
    }
  }

  async trackEvent(eventData: TrackEventDto): Promise<AnalyticsResponseDto> {
    const trackingId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Track with Mixpanel
      if (this.mixpanel) {
        await this.trackMixpanelEvent(eventData, trackingId);
      }
      // Store in database for our own analytics
      await this.storeAnalyticsEvent(eventData, trackingId);

      this.logger.log(`Event tracked: ${eventData.eventType} (ID: ${trackingId})`);
      
      return {
        success: true,
        message: 'Event tracked successfully',
        trackingId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to track event',
        trackingId,
      };
    }
  }

  async trackPageView(pageData: PageViewDto): Promise<AnalyticsResponseDto> {
    const trackingId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Track with Mixpanel
      if (this.mixpanel) {
        await this.trackMixpanelPageView(pageData, trackingId);
      }
      this.logger.log(`Page view tracked: ${pageData.page} (ID: ${trackingId})`);
      
      return {
        success: true,
        message: 'Page view tracked successfully',
        trackingId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to track page view: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to track page view',
        trackingId,
      };
    }
  }

  async getUserMetrics(userId: string) {
    // TODO: Implement user metrics aggregation from our database and external services
    return { 
      message: `Analytics metrics for user: ${userId}`,
      metrics: {
        totalEvents: 0,
        lastActivity: null,
        deviceInfo: {},
        engagementScore: 0,
      }
    };
  }

  private async trackMixpanelEvent(eventData: TrackEventDto, trackingId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const properties = {
        ...eventData.properties,
        tracking_id: trackingId,
        timestamp: new Date().toISOString(),
        platform: 'aeropacer_backend',
        user_id: eventData.userId,
        session_id: eventData.sessionId,
        user_agent: eventData.userAgent,
        ip: eventData.ipAddress,
      };

      this.mixpanel.track(eventData.eventType, properties, (error) => {
        if (error) {
          reject(new Error(`Mixpanel tracking failed: ${error}`));
        } else {
          resolve();
        }
      });
    });
  }

  private async trackMixpanelPageView(pageData: PageViewDto, trackingId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const properties = {
        ...pageData.customProperties,
        tracking_id: trackingId,
        timestamp: new Date().toISOString(),
        platform: 'aeropacer_frontend',
        page: pageData.page,
        title: pageData.title,
        referrer: pageData.referrer,
        user_id: pageData.userId,
        session_id: pageData.sessionId,
        user_agent: pageData.userAgent,
        ip: pageData.ipAddress,
      };

      this.mixpanel.track('page_view', properties, (error) => {
        if (error) {
          reject(new Error(`Mixpanel page view tracking failed: ${error}`));
        } else {
          resolve();
        }
      });
    });
  }

  private async storeAnalyticsEvent(eventData: TrackEventDto, trackingId: string): Promise<void> {
    // TODO: Store analytics event in our database using AnalyticsEvent entity
    // This will be useful for our own dashboard and ML insights
    this.logger.debug(`Storing analytics event: ${eventData.eventType} (${trackingId})`);
  }

  // Running-specific analytics methods
  async trackWorkoutCompleted(userId: string, workoutData: any): Promise<AnalyticsResponseDto> {
    return this.trackEvent({
      eventType: EventType.WORKOUT_COMPLETED,
      userId,
      properties: {
        duration_minutes: workoutData.duration,
        distance_km: workoutData.distance,
        pace_per_km: workoutData.averagePace,
        calories_burned: workoutData.calories,
        workout_type: workoutData.type,
        device: workoutData.device,
      },
    });
  }

  async trackGoalAchieved(userId: string, goalData: any): Promise<AnalyticsResponseDto> {
    return this.trackEvent({
      eventType: EventType.ACHIEVEMENT_UNLOCKED,
      userId,
      properties: {
        goal_type: goalData.type,
        goal_value: goalData.value,
        achievement_date: goalData.achievedAt,
        time_to_achieve_days: goalData.daysToAchieve,
      },
    });
  }

  async trackStravaSync(userId: string, syncData: any): Promise<AnalyticsResponseDto> {
    return this.trackEvent({
      eventType: EventType.ACTIVITY_SYNCED,
      userId,
      properties: {
        activities_synced: syncData.count,
        sync_duration_ms: syncData.duration,
        last_activity_date: syncData.lastActivityDate,
        sync_type: syncData.type, // 'manual' | 'automatic'
      },
    });
  }
}