'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { analyticsApi, activitiesApi, mlApi } from '../../lib/api';
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
  const [mlLoading, setMlLoading] = useState(false);
  const [coaching, setCoaching] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<any | null>(null);
  const [nextWorkout, setNextWorkout] = useState<any | null>(null);

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

      // Fetch ML insights in parallel (non-blocking for initial render)
      setMlLoading(true);
      Promise.allSettled([
        mlApi.getCoachingRecommendations({ limit: 30 }),
        mlApi.predictPerformance({ race_distance: 10000 }), // default 10K
        mlApi.getTrainingLoad(),
        mlApi.getFatigue(),
      ]).then(([recsRes, predRes]) => {
        if (recsRes.status === 'fulfilled') {
          // backend returns {success, data}
          const recsData = (recsRes.value.data?.data) || recsRes.value.data;
          setCoaching(Array.isArray(recsData) ? recsData : []);
        }
        if (predRes.status === 'fulfilled') {
          const predData = (predRes.value.data?.data) || predRes.value.data;
          setPrediction(predData);
        }
      }).finally(() => setMlLoading(false));
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
                {mlLoading && (
                  <div className="text-sm text-gray-600">Loading AI insights…</div>
                )}
                {prediction && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">📈 10K Prediction</h4>
                    <p className="text-blue-700 text-sm">
                      Predicted time: {(prediction.predicted_time/60).toFixed(1)} min • Confidence {(Math.round((prediction.confidence||0)*100))}%
                    </p>
                  </div>
                )}
                {Array.isArray(coaching) && coaching.slice(0,3).map((rec, idx) => (
                  <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-1">{rec.title}</h4>
                    <p className="text-yellow-700 text-sm">{rec.message}</p>
                  </div>
                ))}
                {!mlLoading && (!prediction && coaching.length===0) && (
                  <div className="text-sm text-gray-600">No AI insights yet. Add more activities.</div>
                )}
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
                    Generate a personalized multi-week training plan based on your recent activities.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        setMlLoading(true);
                        const res = await mlApi.generateTrainingPlan({ weeks: 4 });
                        const planData = res.data?.data || res.data;
                        setTrainingPlan(planData);
                      } catch (e) {
                        console.error('Training plan error', e);
                      } finally {
                        setMlLoading(false);
                      }
                    }}
                  >
                    View Training Plan
                  </Button>
                  {trainingPlan && (
                    <div className="mt-4 text-sm text-blue-900">
                      Week 1 target: {trainingPlan?.weeks?.[0]?.target_km || trainingPlan?.targets_km?.[0]} km
                    </div>
                  )}
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <h4 className="font-semibold text-purple-900 mb-3">Recovery Insights</h4>
                  <p className="text-purple-800 text-sm mb-4">
                    Get a specific, model-driven workout suggestion for your next session.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      try {
                        setMlLoading(true);
                        const res = await mlApi.suggestNextWorkout();
                        const w = res.data?.data || res.data;
                        setNextWorkout(w);
                      } catch (e) {
                        console.error('Next workout error', e);
                      } finally {
                        setMlLoading(false);
                      }
                    }}
                  >
                    Plan Workout
                  </Button>
                  {nextWorkout && (
                    <div className="mt-4 text-sm text-purple-900">
                      {nextWorkout.title} • {nextWorkout.distance_km || ''} km @ {nextWorkout.pace_s_per_km ? `${Math.floor(nextWorkout.pace_s_per_km/60)}:${String(Math.floor(nextWorkout.pace_s_per_km%60)).padStart(2,'0')}/km` : ''}
                    </div>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}