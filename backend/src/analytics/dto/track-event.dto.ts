import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';

export enum EventType {
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  STRAVA_CONNECTED = 'strava_connected',
  ACTIVITY_SYNCED = 'activity_synced',
  ACTIVITY_VIEWED = 'activity_viewed',
  DASHBOARD_VIEWED = 'dashboard_viewed',
  PROFILE_UPDATED = 'profile_updated',
  WORKOUT_PLANNED = 'workout_planned',
  WORKOUT_COMPLETED = 'workout_completed',
  GOAL_SET = 'goal_set',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  TRAINING_PLAN_STARTED = 'training_plan_started',
  ANALYTICS_VIEW = 'analytics_view',
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  FEATURE_USED = 'feature_used',
}

export class TrackEventDto {
  @IsEnum(EventType)
  eventType: EventType;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsObject()
  @IsOptional()
  properties?: Record<string, any>;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;
}