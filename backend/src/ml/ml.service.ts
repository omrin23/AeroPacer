import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import axios, { AxiosResponse } from 'axios';

export interface MLActivityData {
  id: string;
  user_id: string;
  strava_id?: string;
  name: string;
  type: string;
  distance: number;
  duration: number;
  average_pace?: number;
  max_pace?: number;
  elevation_gain?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
  average_cadence?: number;
  start_date: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  splits?: Array<{
    distance: number;
    time: number;
    pace: number;
  }>;
  weather?: {
    temperature?: number;
    humidity?: number;
    wind_speed?: number;
    conditions?: string;
  };
  is_race: boolean;
  race_type?: string;
  description?: string;
}

export interface CoachingRecommendation {
  type: string;
  title: string;
  message: string;
  priority: string;
  confidence: number;
  category: string;
  data_points?: Record<string, any>;
}

export interface PerformancePrediction {
  race_distance: number;
  predicted_time: number;
  confidence_interval: {
    min: number;
    max: number;
  };
  pacing_strategy: Array<{
    distance: number;
    target_pace: number;
    cumulative_time: number;
  }>;
  confidence: number;
}

export interface FatigueAnalysis {
  fatigue_score: number;
  recovery_recommendation: string;
  days_to_full_recovery: number;
  training_readiness: string;
  contributing_factors: string[];
}

export interface TrainingLoad {
  acute_load: number;
  chronic_load: number;
  ratio: number;
  risk_level: string;
  recommendation: string;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly mlServiceUrl: string;

  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL', 'http://ml-service:8000');
    this.logger.log(`ML Service URL: ${this.mlServiceUrl}`);
  }

  async getCoachingRecommendations(
    userId: string,
    goals?: string[],
    limit: number = 30
  ): Promise<CoachingRecommendation[]> {
    try {
      // Get recent activities
      const activities = await this.getRecentActivities(userId, limit);
      
      if (activities.length === 0) {
        return [{
          type: 'getting_started',
          title: 'Welcome to AeroPacer!',
          message: 'Connect your Strava account or log some activities to get personalized coaching insights.',
          priority: 'high',
          confidence: 1.0,
          category: 'onboarding'
        }];
      }

      // Get user profile
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      // Convert activities to ML format
      const mlActivities = this.convertActivitiesToMLFormat(activities);
      
      // Call ML service
      const response = await this.callMLService('/coaching/recommendations', {
        user_id: userId,
        activities: mlActivities,
        user_profile: user ? this.convertUserToMLProfile(user) : null,
        goals: goals || []
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error getting coaching recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  async predictPerformance(
    userId: string,
    raceDistance: number,
    raceType?: string
  ): Promise<PerformancePrediction> {
    try {
      // Get recent activities (last 3 months)
      const activities = await this.getRecentActivities(userId, 50);
      
      if (activities.length < 3) {
        throw new HttpException('Need at least 3 activities for performance prediction', HttpStatus.BAD_REQUEST);
      }

      // Convert activities to ML format
      const mlActivities = this.convertActivitiesToMLFormat(activities);
      
      // Call ML service
      const response = await this.callMLService('/performance/predict', {
        user_id: userId,
        activities: mlActivities,
        race_distance: raceDistance,
        race_type: raceType
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error predicting performance:', error);
      throw new HttpException('Failed to predict performance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async analyzeFatigue(userId: string): Promise<FatigueAnalysis> {
    try {
      // Get recent activities (last 2 weeks for fatigue analysis)
      const activities = await this.getRecentActivities(userId, 20);
      
      // Convert activities to ML format
      const mlActivities = this.convertActivitiesToMLFormat(activities);
      
      // Get user profile
      const user = await this.userRepository.findOne({ where: { id: userId } });
      
      // Call ML service
      const response = await this.callMLService('/fatigue/analyze', {
        user_id: userId,
        activities: mlActivities,
        user_profile: user ? this.convertUserToMLProfile(user) : null
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error analyzing fatigue:', error);
      return this.getFallbackFatigueAnalysis();
    }
  }

  async getTrainingLoad(userId: string): Promise<TrainingLoad> {
    try {
      // Get recent activities (last 6 weeks for training load)
      const activities = await this.getRecentActivities(userId, 40);
      
      // Convert activities to ML format
      const mlActivities = this.convertActivitiesToMLFormat(activities);
      
      // Call ML service
      const response = await this.callMLService('/training/load', {
        user_id: userId,
        activities: mlActivities
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error getting training load:', error);
      return this.getFallbackTrainingLoad();
    }
  }

  async getRaceStrategy(
    userId: string,
    raceDistance: number,
    raceDate: Date
  ): Promise<any> {
    try {
      // Get recent activities
      const activities = await this.getRecentActivities(userId, 30);
      
      if (activities.length < 3) {
        throw new HttpException('Need at least 3 activities for race strategy', HttpStatus.BAD_REQUEST);
      }

      // Convert activities to ML format
      const mlActivities = this.convertActivitiesToMLFormat(activities);
      
      // Call ML service
      const response = await this.callMLService('/race/strategy', {
        user_id: userId,
        activities: mlActivities,
        race_distance: raceDistance,
        race_date: raceDate.toISOString()
      });

      return response.data;
    } catch (error) {
      this.logger.error('Error getting race strategy:', error);
      throw new HttpException('Failed to generate race strategy', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkMLServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.mlServiceUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('ML service health check failed:', error.message);
      return false;
    }
  }

  private async getRecentActivities(userId: string, limit: number): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
      take: limit,
    });
  }

  private convertActivitiesToMLFormat(activities: Activity[]): MLActivityData[] {
    return activities.map(activity => ({
      id: activity.id,
      user_id: activity.userId,
      strava_id: activity.stravaId,
      name: activity.name,
      type: activity.type,
      distance: activity.distance,
      duration: activity.duration,
      average_pace: activity.averagePace,
      max_pace: activity.maxPace,
      elevation_gain: activity.elevationGain,
      average_heart_rate: activity.averageHeartRate,
      max_heart_rate: activity.maxHeartRate,
      average_cadence: activity.averageCadence,
      start_date: activity.startDate.toISOString(),
      start_latitude: activity.startLatitude,
      start_longitude: activity.startLongitude,
      end_latitude: activity.endLatitude,
      end_longitude: activity.endLongitude,
      splits: activity.splits,
      weather: activity.weather,
      is_race: activity.isRace,
      race_type: activity.raceType,
      description: activity.description
    }));
  }

  private convertUserToMLProfile(user: User): any {
    return {
      id: user.id,
      // Add user profile fields as they become available
      // age: user.age,
      // gender: user.gender,
      // weight: user.weight,
      // height: user.height,
      // fitness_level: user.fitnessLevel,
      // goals: user.goals
    };
  }

  private async callMLService(endpoint: string, data: any): Promise<AxiosResponse> {
    const url = `${this.mlServiceUrl}${endpoint}`;
    
    this.logger.debug(`Calling ML service: ${url}`);
    
    try {
      const response = await axios.post(url, data, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      return response;
    } catch (error) {
      if (error.response) {
        this.logger.error(`ML service error: ${error.response.status} - ${error.response.data}`);
        throw new HttpException(
          `ML service error: ${error.response.data?.detail || 'Unknown error'}`,
          error.response.status
        );
      } else if (error.request) {
        this.logger.error('ML service unreachable:', error.message);
        throw new HttpException('ML service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
      } else {
        this.logger.error('ML service request error:', error.message);
        throw new HttpException('Failed to call ML service', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private getFallbackRecommendations(): CoachingRecommendation[] {
    return [
      {
        type: 'general',
        title: 'Keep Training Consistently',
        message: 'Maintain 3-4 runs per week to build your aerobic base.',
        priority: 'medium',
        confidence: 0.5,
        category: 'training'
      },
      {
        type: 'general',
        title: 'Listen to Your Body',
        message: 'Include rest days and easy-paced runs for proper recovery.',
        priority: 'medium',
        confidence: 0.5,
        category: 'recovery'
      }
    ];
  }

  private getFallbackFatigueAnalysis(): FatigueAnalysis {
    return {
      fatigue_score: 50,
      recovery_recommendation: 'Unable to analyze fatigue - consider your recent training load',
      days_to_full_recovery: 1,
      training_readiness: 'medium',
      contributing_factors: ['Insufficient data for analysis']
    };
  }

  private getFallbackTrainingLoad(): TrainingLoad {
    return {
      acute_load: 0,
      chronic_load: 0,
      ratio: 0,
      risk_level: 'low',
      recommendation: 'Unable to calculate training load - need more training data'
    };
  }
}