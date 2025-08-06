import React, { useState } from 'react';
import { stravaApi } from '../../lib/api';
import Card from '../ui/Card';
import Button from '../ui/Button';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface StravaConnectionProps {
  status: any;
  onSync: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

const StravaConnection: React.FC<StravaConnectionProps> = ({ 
  status, 
  onSync, 
  onRefresh 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExtendedSyncing, setIsExtendedSyncing] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const response = await stravaApi.connect();
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect to Strava:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await onSync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExtendedSync = async () => {
    try {
      setIsExtendedSyncing(true);
      await stravaApi.syncExtended(12); // Sync 12 months of data
      await onRefresh(); // Refresh the dashboard data
    } catch (error) {
      console.error('Extended sync failed:', error);
    } finally {
      setIsExtendedSyncing(false);
    }
  };

  const isConnected = status?.connected;
  const lastSync = status?.lastSyncAt;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <img 
              src="https://developers.strava.com/images/api_logo_pwrdBy_strava_horiz_light.png" 
              alt="Powered by Strava"
              className="h-8"
            />
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-600">Not Connected</span>
                </>
              )}
            </div>
            
            {isConnected && lastSync && (
              <p className="text-xs text-gray-500 mt-1">
                Last synced: {new Date(lastSync).toLocaleDateString()}
              </p>
            )}
            
            {isConnected && status?.athleteName && (
              <p className="text-sm text-gray-700 mt-1">
                Connected as: {status.athleteName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                isLoading={isSyncing}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Sync Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExtendedSync}
                isLoading={isExtendedSyncing}
                leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              >
                Sync History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
              >
                Refresh
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnect}
              isLoading={isConnecting}
              leftIcon={<LinkIcon className="h-4 w-4" />}
            >
              Connect Strava
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Connect your Strava account
          </h4>
          <p className="text-sm text-blue-700">
            Import your running activities automatically and get personalized insights based on your training data.
          </p>
        </div>
      )}
    </Card>
  );
};

export default StravaConnection;