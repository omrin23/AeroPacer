import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  CalendarIcon,
  ClockIcon,
  MapIcon,
  FireIcon,
  TrophyIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

interface StatsOverviewProps {
  stats: any;
}

type TimePeriod = 'week' | 'month' | 'all';

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');

  const defaultStats = {
    totalActivities: 0,
    totalDistance: 0,
    totalDuration: 0,
    averagePace: 0,
    averageHeartRate: 0,
    calories: 0,
    thisWeek: { activities: 0, distance: 0, duration: 0 },
    thisMonth: { activities: 0, distance: 0, duration: 0 },
  };

  const currentStats = { ...defaultStats, ...stats };

  // Get stats based on selected time period
  const getPeriodStats = () => {
    switch (selectedPeriod) {
      case 'week':
        return {
          activities: currentStats.thisWeek?.activities || 0,
          distance: currentStats.thisWeek?.distance || 0,
          duration: currentStats.thisWeek?.duration || 0,
          avgPace: currentStats.averagePace,
        };
      case 'month':
        return {
          activities: currentStats.thisMonth?.activities || 0,
          distance: currentStats.thisMonth?.distance || 0,
          duration: currentStats.thisMonth?.duration || 0,
          avgPace: currentStats.averagePace,
        };
      case 'all':
        return {
          activities: currentStats.totalActivities || 0,
          distance: currentStats.totalDistance || 0,
          duration: currentStats.totalDuration || 0,
          avgPace: currentStats.averagePace,
        };
    }
  };

  const periodStats = getPeriodStats();

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatPace = (paceSeconds: number) => {
    if (!paceSeconds || paceSeconds <= 0) return '0:00';
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatHeartRate = (heartRate: number) => {
    return heartRate > 0 ? `${Math.round(heartRate)} bpm` : 'N/A';
  };

  // Simple calorie estimation based on distance and duration
  const estimateCalories = (distance: number, duration: number) => {
    if (distance <= 0 || duration <= 0) return 0;
    // Rough estimation: ~60-80 calories per km for running
    const kmDistance = distance;
    return Math.round(kmDistance * 70); // 70 calories per km average
  };

  const statsData = [
    {
      label: `${selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'Total'} Runs`,
      value: periodStats.activities.toLocaleString(),
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Distance',
      value: formatDistance(periodStats.distance),
      icon: MapIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Time',
      value: formatDuration(periodStats.duration),
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg Pace',
      value: `${formatPace(periodStats.avgPace)}/km`,
      icon: TrophyIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Avg Heart Rate',
      value: formatHeartRate(currentStats.averageHeartRate),
      icon: HeartIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Est. Calories',
      value: estimateCalories(periodStats.distance, periodStats.duration).toLocaleString(),
      icon: FireIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Running Stats</h2>
        
        {/* Time Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'all'] as TimePeriod[]).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Summary for verification */}
      {periodStats.activities > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">📊 Data Summary</h4>
          <p className="text-sm text-blue-700">
            Showing {periodStats.activities} {periodStats.activities === 1 ? 'activity' : 'activities'} 
            {selectedPeriod === 'week' ? ' from this week' : selectedPeriod === 'month' ? ' from the last 30 days' : ' total'}
            {periodStats.distance > 0 && ` • ${formatDistance(periodStats.distance)} total distance`}
            {periodStats.duration > 0 && ` • ${formatDuration(periodStats.duration)} total time`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index} padding="md" shadow="sm" hover className="text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-3`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;