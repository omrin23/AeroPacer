import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Activity } from '../entities/activity.entity';

export interface ActivityQuery {
  page?: number;
  limit?: number;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ActivityStats {
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  averagePace: number;
  averageDistance: number;
  averageHeartRate: number;
  thisWeek: {
    activities: number;
    distance: number;
    duration: number;
  };
  thisMonth: {
    activities: number;
    distance: number;
    duration: number;
  };
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async getUserActivities(userId: string, query: ActivityQuery = {}) {
    const { page = 1, limit = 20, type, dateFrom, dateTo } = query;
    
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .orderBy('activity.startDate', 'DESC');

    if (type) {
      queryBuilder.andWhere('activity.type = :type', { type });
    }

    if (dateFrom) {
      queryBuilder.andWhere('activity.startDate >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere('activity.startDate <= :dateTo', { dateTo });
    }

    const [activities, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityById(userId: string, activityId: string): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, userId },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async getUserStats(userId: string): Promise<ActivityStats> {
    const allActivities = await this.activityRepository.find({
      where: { userId },
      select: ['distance', 'duration', 'averagePace', 'startDate', 'averageHeartRate'],
    });

    if (allActivities.length === 0) {
      return {
        totalActivities: 0,
        totalDistance: 0,
        totalDuration: 0,
        averagePace: 0,
        averageDistance: 0,
        averageHeartRate: 0,
        thisWeek: { activities: 0, distance: 0, duration: 0 },
        thisMonth: { activities: 0, distance: 0, duration: 0 },
      };
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate current week (Monday to Sunday)
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Sunday
    currentWeekEnd.setHours(23, 59, 59, 999);

    const totalDistance = allActivities.reduce((sum, activity) => sum + Number(activity.distance), 0);
    const totalDuration = allActivities.reduce((sum, activity) => sum + activity.duration, 0);
    const validPaces = allActivities.filter(a => a.averagePace > 0).map(a => Number(a.averagePace));
    const averagePace = validPaces.length > 0 ? validPaces.reduce((sum, pace) => sum + pace, 0) / validPaces.length : 0;
    
    const validHeartRates = allActivities.filter(a => a.averageHeartRate > 0).map(a => Number(a.averageHeartRate));
    const averageHeartRate = validHeartRates.length > 0 ? validHeartRates.reduce((sum, hr) => sum + hr, 0) / validHeartRates.length : 0;

    // Filter activities for current week (Monday to Sunday)
    const thisWeekActivities = allActivities.filter(a => {
      const activityDate = new Date(a.startDate);
      return activityDate >= currentWeekStart && activityDate <= currentWeekEnd;
    });
    

    
    const thisMonthActivities = allActivities.filter(a => a.startDate >= oneMonthAgo);

    return {
      totalActivities: allActivities.length,
      totalDistance: totalDistance / 1000, // Convert to km
      totalDuration,
      averagePace,
      averageDistance: totalDistance / allActivities.length / 1000, // Average distance in km
      averageHeartRate,
      thisWeek: {
        activities: thisWeekActivities.length,
        distance: thisWeekActivities.reduce((sum, a) => sum + Number(a.distance), 0) / 1000,
        duration: thisWeekActivities.reduce((sum, a) => sum + a.duration, 0),
      },
      thisMonth: {
        activities: thisMonthActivities.length,
        distance: thisMonthActivities.reduce((sum, a) => sum + Number(a.distance), 0) / 1000,
        duration: thisMonthActivities.reduce((sum, a) => sum + a.duration, 0),
      },
    };
  }

  async getRecentActivities(userId: string, limit: number = 5): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { userId },
      order: { startDate: 'DESC' },
      take: limit,
    });
  }

  async deleteActivity(userId: string, activityId: string): Promise<{ success: boolean; message: string }> {
    const activity = await this.getActivityById(userId, activityId);
    
    await this.activityRepository.remove(activity);
    
    return {
      success: true,
      message: 'Activity deleted successfully',
    };
  }
}