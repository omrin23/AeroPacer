'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { analyticsApi } from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Cog6ToothIcon, 
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  EyeIcon,
  UserIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      weekly: true,
      achievements: true,
    },
    privacy: {
      publicProfile: false,
      shareActivities: true,
      analytics: true,
    },
    preferences: {
      units: 'metric', // metric or imperial
      language: 'en',
      theme: 'light', // light or dark
      timezone: 'auto',
    }
  });

  // Track page view
  useEffect(() => {
    // Non-blocking analytics tracking
    analyticsApi.trackPageView({
      page: '/settings',
      title: 'Settings - AeroPacer',
    }).catch(error => {
      console.warn('Analytics tracking failed (non-critical):', error);
    });
  }, []);

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Here you would typically save to your backend
      console.log('Saving settings:', settings);
      // For now, just show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center" style={{fontFamily:'var(--font-sora)'}}>
            <Cog6ToothIcon className="h-8 w-8 mr-3 text-primary-soft" />
            Settings
          </h1>
          <p className="text-subtle">
            Customize your AeroPacer experience
          </p>
        </div>

        <div className="space-y-8">
          {/* Notifications */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <BellIcon className="h-5 w-5 mr-2 text-primary-soft" />
                Notifications
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Email Notifications</label>
                    <p className="text-sm text-subtle">Receive updates and insights via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Push Notifications</label>
                    <p className="text-sm text-subtle">Receive notifications on your device</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.push}
                      onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Weekly Reports</label>
                    <p className="text-sm text-subtle">Get weekly progress summaries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.weekly}
                      onChange={(e) => handleSettingChange('notifications', 'weekly', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Achievement Alerts</label>
                    <p className="text-sm text-subtle">Get notified when you hit milestones</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.achievements}
                      onChange={(e) => handleSettingChange('notifications', 'achievements', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Privacy */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-success" />
                Privacy & Data
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Public Profile</label>
                    <p className="text-sm text-subtle">Make your profile visible to other users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.publicProfile}
                      onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Share Activities</label>
                    <p className="text-sm text-subtle">Allow others to see your activity feed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.shareActivities}
                      onChange={(e) => handleSettingChange('privacy', 'shareActivities', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Analytics Data</label>
                    <p className="text-sm text-subtle">Help improve AeroPacer with usage data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.analytics}
                      onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 border border-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:bg-primary-soft/40"></div>
                  </label>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Preferences */}
          <Card>
            <Card.Header>
                <h3 className="text-lg font-semibold text-foreground flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-accent-purple" />
                Preferences
              </h3>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units
                  </label>
                  <select
                    value={settings.preferences.units}
                    onChange={(e) => handleSettingChange('preferences', 'units', e.target.value)}
                    className="w-full p-3 bg-elevated/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="metric">Metric (km, °C)</option>
                    <option value="imperial">Imperial (miles, °F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    className="w-full p-3 bg-elevated/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                    className="w-full p-3 bg-elevated/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                    className="w-full p-3 bg-elevated/60 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="auto">Auto-detect</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button variant="ghost" size="md">
              Reset to Defaults
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}