'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { activitiesApi, stravaApi, analyticsApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatsOverview from '../../components/dashboard/StatsOverview';
import RecentActivities from '../../components/dashboard/RecentActivities';
import StravaConnection from '../../components/dashboard/StravaConnection';
import WeeklyChart from '../../components/dashboard/WeeklyChart';
import RunningConditions from '../../components/dashboard/RunningConditions';
import { 
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  activities: any[];
  stats: any;
  stravaStatus: any;
  recentActivities: any[];
}

export default function DashboardPage() {
  const { user, refreshAuth } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stravaMessage, setStravaMessage] = useState('');

  // Handle Strava OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaSuccess = urlParams.get('strava_success');
    const stravaError = urlParams.get('strava_error');
    
    if (stravaSuccess === 'true') {
      console.log('Strava OAuth callback detected - processing...');
      setStravaMessage('✅ Strava connected successfully!');
      
      // Clean up URL immediately
      window.history.replaceState({}, document.title, '/dashboard');
      
      // Force authentication re-check without page reload
      setTimeout(async () => {
        console.log('Refreshing auth state after OAuth...');
        try {
          await refreshAuth();
          
          // Wait for state propagation, then refresh dashboard data
          setTimeout(() => {
            console.log('Fetching dashboard data after auth refresh...');
            fetchDashboardData();
          }, 1000); // Increased timeout for better reliability
        } catch (error) {
          console.error('Failed to refresh auth after Strava connection:', error);
          setStravaMessage('⚠️ Strava connected but page needs refresh');
        }
      }, 1500); // Increased initial timeout
      
    } else if (stravaError) {
      setStravaMessage(`❌ Strava connection failed: ${stravaError}`);
      // Clean up URL
      window.history.replaceState({}, document.title, '/dashboard');
    }
    
    // Clear message after 5 seconds
    if (stravaSuccess || stravaError) {
      setTimeout(() => setStravaMessage(''), 5000);
    }
  }, []); // Remove user dependency to avoid loops

  // Track page view
  useEffect(() => {
    // Non-blocking analytics tracking
    analyticsApi.trackPageView({
      page: '/dashboard',
      title: 'Dashboard - AeroPacer',
    }).catch(error => {
      console.warn('Analytics tracking failed (non-critical):', error);
    });
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [activitiesRes, statsRes, stravaStatusRes] = await Promise.allSettled([
        activitiesApi.getActivities({ limit: 50 }), // Get activities for both chart and recent
        activitiesApi.getStats(),
        stravaApi.getStatus(),
      ]);



      const allActivities = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data.activities : [];
      
      // Debug logging to verify the fix
      console.log('Activities response structure:', activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : 'No response');
      console.log('All activities array:', allActivities);
      console.log('Is allActivities an array?', Array.isArray(allActivities));
      
      const dashboardData = {
        activities: allActivities, // Use for chart
        stats: statsRes.status === 'fulfilled' ? statsRes.value.data : {},
        stravaStatus: stravaStatusRes.status === 'fulfilled' ? stravaStatusRes.value.data : {},
        recentActivities: allActivities.slice(0, 5), // Use first 5 for recent activities
      };

      setData(dashboardData);

      // Auto-sync if Strava is connected but no activities exist
      if (dashboardData.stravaStatus?.connected && 
          (!dashboardData.recentActivities || dashboardData.recentActivities.length === 0)) {
        console.log('Strava connected but no activities found - triggering auto-sync...');
        try {
          const syncResult = await stravaApi.sync();
          console.log('Auto-sync completed:', syncResult);
          
          // Refresh data after auto-sync
          setTimeout(() => {
            fetchDashboardData();
          }, 2000);
        } catch (syncError) {
          console.error('Auto-sync failed:', syncError);
        }
      }
    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const handleStravaSync = async () => {
    try {
      await stravaApi.sync();
      
      // Track sync event (non-blocking to prevent GTM errors from affecting sync)
      analyticsApi.trackStravaSync({
        count: 0, // Will be updated by backend
        type: 'manual',
      }).catch(error => {
        console.warn('Analytics tracking failed (non-critical):', error);
      });
      
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-soft mx-auto mb-4"></div>
          <p className="text-subtle">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2" style={{fontFamily:'var(--font-sora)'}}>
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 🏃‍♂️
          </h1>
          <p className="text-subtle">
            Here's what's happening with your running journey
          </p>
          {user?.stravaId && (
            <p className="text-sm text-success mt-1">
              ✅ Connected to Strava
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg p-4 bg-danger/10 border border-danger/30">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {stravaMessage && (
          <div className={`mb-6 border rounded-lg p-4 ${
            stravaMessage.includes('✅') 
              ? 'bg-success/10 border-success/30 text-success' 
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            <p>{stravaMessage}</p>
          </div>
        )}

        {/* Strava Connection Status */}
        <div className="mb-8">
          <StravaConnection 
            status={data?.stravaStatus} 
            onSync={handleStravaSync}
            onRefresh={fetchDashboardData}
          />
        </div>

        {/* Stats Overview */}
        <div className="mb-8">
          <StatsOverview stats={data?.stats} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Running Conditions moved to left for better organization */}
            <RunningConditions />
            {/* Weekly Activity Chart */}
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-2 text-primary-soft" />
                    Weekly Activity
                  </h3>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <WeeklyChart activities={data?.activities || []} />
              </Card.Content>
            </Card>


          </div>

          {/* Right Column - Recent Activities */}
          <div className="space-y-8">
            {/* Recent Activities */}
            <RecentActivities activities={data?.recentActivities || []} />
          </div>
        </div>
      </div>
    </div>
  );
}