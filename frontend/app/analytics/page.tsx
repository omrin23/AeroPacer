'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { analyticsApi, activitiesApi, mlApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import WeeklyChart from '../../components/dashboard/WeeklyChart';
import StatsOverview from '../../components/dashboard/StatsOverview';
import TrainingPlanViewer from '../../components/analytics/TrainingPlan';
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
  const [goal, setGoal] = useState<{race_distance_km?: number; race_date?: string; target_time_s?: number}>({});
  const [fatigue, setFatigue] = useState<any | null>(null);
  const [trainingLoad, setTrainingLoad] = useState<any | null>(null);

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
      ]).then(([recsRes, predRes, loadRes, fatRes]) => {
        if (recsRes.status === 'fulfilled') {
          const recsData = (recsRes.value.data?.data) || recsRes.value.data;
          setCoaching(Array.isArray(recsData) ? recsData : []);
        }
        if (predRes.status === 'fulfilled') {
          const predData = (predRes.value.data?.data) || predRes.value.data;
          setPrediction(predData);
        }
        if (loadRes.status === 'fulfilled') {
          const loadData = (loadRes.value.data?.data) || loadRes.value.data;
          setTrainingLoad(loadData);
        }
        if (fatRes.status === 'fulfilled') {
          const fatData = (fatRes.value.data?.data) || fatRes.value.data;
          setFatigue(fatData);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-soft mx-auto mb-4"></div>
          <p className="text-subtle">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center" style={{fontFamily:'var(--font-sora)'}}>
            <ChartBarIcon className="h-8 w-8 mr-3 text-primary-soft" />
            Analytics Dashboard
          </h1>
          <p className="text-subtle">
            Deep insights into your running performance and trends
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg p-4 bg-danger/10 border border-danger/30">
            <p className="text-danger">{error}</p>
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
              <h3 className="text-lg font-semibold text-foreground">Weekly Activity Trends</h3>
            </Card.Header>
            <Card.Content>
              <WeeklyChart activities={data?.activities || []} />
            </Card.Content>
          </Card>

          {/* Performance Insights */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <FireIcon className="h-5 w-5 mr-2 text-warning" />
                AI Performance Insights
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {mlLoading && (
                  <div className="text-sm text-subtle">Loading AI insights…</div>
                )}
                {prediction && (
                  <div className="bg-white/5 border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-2">📈 10K Prediction</h4>
                    <p className="text-sm text-subtle">
                      Predicted time: {(prediction.predicted_time/60).toFixed(1)} min • Confidence {(Math.round((prediction.confidence||0)*100))}%
                    </p>
                  </div>
                )}
                {Array.isArray(coaching) && coaching.slice(0,3).map((rec, idx) => (
                  <div key={idx} className="bg-white/5 border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-1">{rec.title}</h4>
                    <p className="text-sm text-subtle">{rec.message}</p>
                  </div>
                ))}
                {!mlLoading && (!prediction && coaching.length===0) && (
                  <div className="text-sm text-subtle">No AI insights yet. Add more activities.</div>
                )}
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* AI-Powered Recommendations */}
        <div className="mt-8">
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-foreground">🤖 AI Coaching Recommendations</h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-border rounded-lg p-6">
                  <h4 className="font-semibold mb-3">Training Focus</h4>
                  <p className="text-sm text-subtle mb-4">
                    Plan with goal: set your race, target time, and date to get a tailored plan.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <input
                      className="bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-foreground"
                      type="number"
                      step="0.1"
                      placeholder="Distance (km) e.g. 42.2"
                      value={goal.race_distance_km ?? ''}
                      onChange={(e) => setGoal(g => ({...g, race_distance_km: e.target.value ? Number(e.target.value) : undefined}))}
                    />
                    <input
                      className="bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-foreground"
                      type="date"
                      value={goal.race_date ?? ''}
                      onChange={(e) => setGoal(g => ({...g, race_date: e.target.value || undefined}))}
                    />
                    <input
                      className="bg-transparent border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-foreground"
                      type="text"
                      placeholder="Target HH:MM:SS"
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        const parts = v.split(':').map(Number);
                        let secs: number | undefined = undefined;
                        if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
                          secs = parts[0]*3600 + parts[1]*60 + parts[2];
                        }
                        setGoal(g => ({...g, target_time_s: secs}));
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          setMlLoading(true);
                          const res = await mlApi.generateTrainingPlan({ 
                            weeks: 4,
                            race_distance: goal.race_distance_km ? goal.race_distance_km * 1000 : undefined,
                            race_date: goal.race_date,
                            target_time_s: goal.target_time_s,
                          });
                          const planData = res.data?.data || res.data;
                          setTrainingPlan(planData);
                        } catch (e) {
                          console.error('Training plan error', e);
                        } finally {
                          setMlLoading(false);
                        }
                      }}
                    >
                      Plan with Goal
                    </Button>
                    {trainingPlan && (
                      <div className="w-full mt-4">
                        <TrainingPlanViewer plan={trainingPlan} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white/5 border border-border rounded-lg p-6">
                  <h4 className="font-semibold mb-3">Recovery Insights</h4>
                  <div className="text-sm space-y-2">
                    {fatigue && (
                      <div className="bg-white/5 border border-border rounded p-3">
                        <div className="font-medium">Readiness</div>
                        {(() => {
                          const fatigueScore = Math.round(fatigue.fatigue_score || 0);
                          const readinessScore = Math.max(0, 100 - fatigueScore);
                          return (
                            <div className="text-subtle">
                              Readiness: {fatigue.training_readiness} • Readiness score: {readinessScore}/100
                            </div>
                          );
                        })()}
                        {typeof fatigue.days_to_full_recovery === 'number' && (
                          <div className="text-subtle">Days to full recovery: {fatigue.days_to_full_recovery}</div>
                        )}
                      </div>
                    )}
                    {trainingLoad && (
                      <div className="bg-white/5 border border-border rounded p-3">
                        <div className="font-medium">Training Load</div>
                        <div className="text-subtle">ACWR: {trainingLoad.ratio?.toFixed ? trainingLoad.ratio.toFixed(2) : trainingLoad.ratio} • Risk: {trainingLoad.risk_level}</div>
                        <div className="text-subtle">Acute: {Math.round(trainingLoad.acute_load)} • Chronic: {Math.round(trainingLoad.chronic_load)}</div>
                        {trainingLoad.recommendation && (
                          <div className="text-subtle">Recommendation: {trainingLoad.recommendation}</div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setMlLoading(true);
                            const [load, fat] = await Promise.all([
                              mlApi.getTrainingLoad(),
                              mlApi.getFatigue(),
                            ]);
                            const loadData = (load.data?.data) || load.data;
                            const fatData = (fat.data?.data) || fat.data;
                            setTrainingLoad(loadData);
                            setFatigue(fatData);
                          } catch (e) {
                            console.error('Refresh insights error', e);
                          } finally {
                            setMlLoading(false);
                          }
                        }}
                      >
                        Refresh insights
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setMlLoading(true);
                            // Refresh metrics and get next workout from ML
                            const [load, fat, wRes] = await Promise.all([
                              mlApi.getTrainingLoad(),
                              mlApi.getFatigue(),
                              mlApi.suggestNextWorkout(),
                            ]);
                            setTrainingLoad((load.data?.data) || load.data);
                            setFatigue((fat.data?.data) || fat.data);
                            const w = wRes.data?.data || wRes.data;
                            setNextWorkout(w);
                          } catch (e) {
                            console.error('Next workout error', e);
                          } finally {
                            setMlLoading(false);
                          }
                        }}
                      >
                        Suggest Next Workout
                      </Button>
                    </div>
                    {nextWorkout && (
                      <div className="mt-2 text-sm text-foreground">
                        Suggested next workout: {nextWorkout.title} • {nextWorkout.distance_km || ''} km @ {nextWorkout.pace_s_per_km ? `${Math.floor(nextWorkout.pace_s_per_km/60)}:${String(Math.floor(nextWorkout.pace_s_per_km%60)).padStart(2,'0')}/km` : ''}
                      </div>
                    )}
                    {fatigue && trainingLoad && (
                      <div className="mt-2 text-xs text-subtle">
                        {(() => {
                          const lastRunDaysAgo = (() => {
                            const acts = data?.activities || [];
                            if (!Array.isArray(acts) || acts.length === 0) return undefined;
                            const latest = acts[0]?.startDate ? new Date(acts[0].startDate) : undefined;
                            if (!latest) return undefined;
                            return Math.floor((Date.now() - latest.getTime()) / (1000*60*60*24));
                          })();
                          const parts: string[] = [];
                          if (typeof lastRunDaysAgo === 'number') {
                            if (lastRunDaysAgo >= 3 && fatigue.fatigue_score > 40) {
                              parts.push('Adjusted readiness based on your recent rest.');
                            }
                          }
                          if (trainingLoad.ratio > 1.3) {
                            parts.push('High stress this week, consider dialing back.');
                          } else if (trainingLoad.ratio < 0.8) {
                            parts.push('Load is low; you can safely build gradually.');
                          } else {
                            parts.push('Training load is balanced; maintain current approach.');
                          }
                          return parts.join(' ');
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}