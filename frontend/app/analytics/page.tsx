'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { analyticsApi, activitiesApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import WeeklyChart from '../../components/dashboard/WeeklyChart';
import StatsOverview from '../../components/dashboard/StatsOverview';
import { 
  ChartBarIcon, 
  FireIcon
} from '@heroicons/react/24/outline';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track page view
  useEffect(() => {
    // Non-blocking analytics tracking
    analyticsApi.trackPageView({
      page: '/analytics',
      title: 'Analytics - AeroPacer',
    }).catch(error => {
      console.warn('Analytics tracking failed (non-critical):', error);
    });
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [activitiesRes, statsRes] = await Promise.allSettled([
        activitiesApi.getActivities({ limit: 50 }),
        activitiesApi.getStats(),
      ]);

      const activities = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data.activities : [];
      
      // Debug logging to verify the fix
      console.log('Analytics - Activities response structure:', activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : 'No response');
      console.log('Analytics - Activities array:', activities);
      console.log('Analytics - Is activities an array?', Array.isArray(activities));
      
      setData({
        activities: activities,
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {},
      });
    } catch (err: any) {
      setError('Failed to load analytics data');
      console.error('Analytics data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Deep insights into your running performance and trends
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Overview - Same as Dashboard */}
        <div className="mb-8">
          <StatsOverview stats={data?.stats} />
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Activity Chart */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Activity Trends</h3>
            </Card.Header>
            <Card.Content>
              <WeeklyChart activities={data?.activities || []} />
            </Card.Content>
          </Card>

          {/* Performance Insights */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FireIcon className="h-5 w-5 mr-2 text-orange-600" />
                AI Performance Insights
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📈 Progress Analysis</h4>
                  <p className="text-blue-700 text-sm">
                    Your running consistency has improved by 25% this month. Keep maintaining this steady rhythm!
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">🎯 Goal Tracking</h4>
                  <p className="text-green-700 text-sm">
                    You're on track to exceed your monthly distance goal by 15%. Consider setting a more challenging target!
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">⚡ Performance Tip</h4>
                  <p className="text-yellow-700 text-sm">
                    Your best performances happen on Tuesday and Thursday. Try scheduling key workouts on these days.
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* AI-Powered Recommendations */}
        <div className="mt-8">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-gray-900">🤖 AI Coaching Recommendations</h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Training Focus</h4>
                  <p className="text-blue-800 text-sm mb-4">
                    Based on your recent activities, we recommend focusing on endurance building with longer, slower runs.
                  </p>
                  <Button variant="outline" size="sm">
                    View Training Plan
                  </Button>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-3">Recovery Insights</h4>
                  <p className="text-purple-800 text-sm mb-4">
                    Your recovery metrics suggest you're ready for a higher intensity session. Consider a tempo run.
                  </p>
                  <Button variant="outline" size="sm">
                    Plan Workout
                  </Button>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}