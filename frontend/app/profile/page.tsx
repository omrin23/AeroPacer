'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { analyticsApi, stravaApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  UserIcon, 
  EnvelopeIcon,
  CalendarIcon,
  TrophyIcon,
  LinkIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stravaStatus, setStravaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Track page view
  useEffect(() => {
    // Non-blocking analytics tracking
    analyticsApi.trackPageView({
      page: '/profile',
      title: 'Profile - AeroPacer',
    }).catch(error => {
      console.warn('Analytics tracking failed (non-critical):', error);
    });
  }, []);

  const fetchStravaStatus = async () => {
    try {
      const response = await stravaApi.getStatus();
      setStravaStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch Strava status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStravaStatus();
    }
  }, [user]);

  const handleStravaDisconnect = async () => {
    try {
      await stravaApi.disconnect();
      setStravaStatus({ connected: false });
    } catch (error) {
      console.error('Failed to disconnect Strava:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <UserIcon className="h-8 w-8 mr-3 text-blue-600" />
            Profile
          </h1>
          <p className="text-gray-600">
            Manage your account and connected services
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    leftIcon={<PencilIcon className="h-4 w-4" />}
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </h4>
                      <p className="text-gray-600">Runner • AeroPacer Athlete</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                        Email
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{user?.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Member Since
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {editing && (
                    <div className="flex space-x-4 pt-4 border-t">
                      <Button variant="primary" size="sm">
                        Save Changes
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </Card.Content>
            </Card>

            {/* Running Stats */}
            <Card className="mt-6">
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrophyIcon className="h-5 w-5 mr-2 text-yellow-600" />
                  Running Achievements
                </h3>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">42</p>
                    <p className="text-sm text-blue-700">Total Runs</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">156km</p>
                    <p className="text-sm text-green-700">Total Distance</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">5:24</p>
                    <p className="text-sm text-purple-700">Best Pace</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">24h</p>
                    <p className="text-sm text-orange-700">Total Time</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Connected Services */}
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Connected Services</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {/* Strava Integration */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Strava</p>
                        <p className="text-sm text-gray-600">
                          {stravaStatus?.connected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    {stravaStatus?.connected ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleStravaDisconnect}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm">
                        Connect
                      </Button>
                    )}
                  </div>

                  {/* Future integrations */}
                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Garmin Connect</p>
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Connect
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Quick Actions */}
            <Card>
              <Card.Header>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <Button variant="outline" size="md" className="w-full">
                    Download Data
                  </Button>
                  <Button variant="outline" size="md" className="w-full">
                    Privacy Settings
                  </Button>
                  <Button variant="ghost" size="md" className="w-full text-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}