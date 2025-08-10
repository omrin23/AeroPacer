import React from 'react';
import Link from 'next/link';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  MapPinIcon,
  ClockIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  name: string;
  type: string;
  distance: number;
  duration: number;
  averagePace: number; // Changed from string to number - backend provides pace in seconds per km
  startDate: string;
  location?: string;
  calories?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  stravaId?: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];
  
  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatPace = (paceSeconds: number) => {
    if (!paceSeconds || paceSeconds <= 0) return '0:00';
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '🏃‍♂️';
      case 'walk':
        return '🚶‍♂️';
      case 'bike':
        return '🚴‍♂️';
      case 'swim':
        return '🏊‍♂️';
      default:
        return '💪';
    }
  };

  if (!safeActivities || safeActivities.length === 0) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-foreground">Recent Activities</h3>
        </Card.Header>
        <Card.Content>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <h4 className="text-lg font-medium mb-2">No activities yet</h4>
            <p className="text-subtle mb-4">
              Connect your Strava account to see your recent activities
            </p>
            <Button variant="primary" size="sm">
              Connect Strava
            </Button>
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
      <Card>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Recent Activities</h3>
          <Link href="/activities">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        
        {/* Data verification summary */}
        {safeActivities.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            📊 Showing {safeActivities.length} recent {safeActivities.length === 1 ? 'activity' : 'activities'}
            {' • '}Total: {(() => {
              const totalDistance = safeActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
              return isNaN(totalDistance) ? '0.00' : (totalDistance / 1000).toFixed(2);
            })()} km
            {' • '}Latest: {formatDate(safeActivities[0]?.startDate)}
          </div>
        )}
      </Card.Header>
      <Card.Content>
        <div className="space-y-4">
          {safeActivities.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="border border-border rounded-lg p-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-2xl">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate text-foreground">
                      {activity.name}
                    </h4>
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-subtle">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-3 w-3" />
                        <span>{formatDistance(activity.distance)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{formatDuration(activity.duration)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDate(activity.startDate)}</span>
                      </div>
                    </div>
                    
                    {activity.averagePace && activity.averagePace > 0 && (
                      <p className="text-xs text-muted mt-1">
                        Avg pace: {formatPace(activity.averagePace)}/km
                      </p>
                    )}
                    
                    {activity.averageHeartRate && (
                      <p className="text-xs text-muted mt-1">
                        ❤️ Avg HR: {Math.round(activity.averageHeartRate)} bpm
                      </p>
                    )}
                    
                    {/* Enhanced activity details for verification */}
                    <div className="mt-2 text-xs text-muted">
                      <div className="flex flex-wrap gap-2">
                        {activity.startDate && (
                          <span className="bg-white/5 border border-border px-2 py-1 rounded">
                            📅 {new Date(activity.startDate).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {activity.type && (
                          <span className="bg-white/5 text-foreground px-2 py-1 rounded border border-border">
                            🏃 {activity.type}
                          </span>
                        )}
                        {activity.stravaId && (
                          <span className="bg-white/5 text-foreground px-2 py-1 rounded border border-border">
                            📱 Strava
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {activity.location && (
                      <p className="text-xs text-muted mt-1 truncate">
                        📍 {activity.location}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="xs"
                  className="ml-2"
                  rightIcon={<ArrowTopRightOnSquareIcon className="h-3 w-3" />}
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
};

export default RecentActivities;