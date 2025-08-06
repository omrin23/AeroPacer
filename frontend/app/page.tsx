'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../lib/auth-context';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { 
  ChartBarIcon, 
  CogIcon, 
  LinkIcon, 
  TrophyIcon 
} from '@heroicons/react/24/outline';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  // Debug auth state
  console.log('Page render - loading:', loading, 'isAuthenticated:', isAuthenticated);

  // Loading check for authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-center mt-4">
          <p className="text-gray-600">Loading auth state... (loading={String(loading)})</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to AeroPacer
              <span className="block text-blue-600">🏃‍♂️💨</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              AI-Powered Running Analytics & Personalized Coaching
            </p>
            
            <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
              Transform your running journey with intelligent insights, personalized coaching, 
              and comprehensive performance tracking powered by artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Start Your Journey
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Every Runner
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a beginner or a seasoned athlete, AeroPacer provides the tools 
              you need to reach your running goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <LinkIcon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Strava Integration
                </h3>
                <p className="text-gray-600 text-sm">
                  Seamlessly connect with Strava to import your activities and unlock deeper insights.
                </p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CogIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Coaching
                </h3>
                <p className="text-gray-600 text-sm">
                  Get personalized training recommendations based on your performance and goals.
                </p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600 text-sm">
                  Track performance trends, fatigue levels, and recovery patterns with detailed analytics.
                </p>
              </div>
            </Card>

            <Card className="text-center h-full" hover>
              <div className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrophyIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Race Planning
                </h3>
                <p className="text-gray-600 text-sm">
                  Plan your race strategy with intelligent pacing recommendations and goal setting.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Running?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of runners who are already using AeroPacer to reach their goals.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}