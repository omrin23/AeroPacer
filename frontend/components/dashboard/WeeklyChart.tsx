import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import Button from '../ui/Button';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  distance: number;
  duration: number;
  startDate: string;
  type: string;
}

interface WeeklyChartProps {
  activities: Activity[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ activities }) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous week, etc.

  const weeklyData = useMemo(() => {
    // Ensure activities is always an array
    const safeActivities = Array.isArray(activities) ? activities : [];
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7)); // Monday + offset

    const data = days.map((day, index) => {
      const currentDay = new Date(weekStart);
      currentDay.setDate(weekStart.getDate() + index);
      
      const dayActivities = safeActivities.filter(activity => {
        const activityDate = new Date(activity.startDate);
        // Simple date comparison using toDateString()
        return activityDate.toDateString() === currentDay.toDateString();
      });

      const totalDistance = dayActivities.reduce((sum, activity) => sum + (activity.distance / 1000), 0);
      const totalDuration = dayActivities.reduce((sum, activity) => sum + (activity.duration / 60), 0);
      

      
      return {
        day,
        distance: Number(totalDistance.toFixed(2)),
        duration: Number(totalDuration.toFixed(0)),
        activities: dayActivities.length,
        date: currentDay.toDateString(),
      };
    });

    return data;
  }, [activities, weekOffset]);

  const maxDistance = Math.max(...weeklyData.map(d => d.distance), 10);
  const maxDuration = Math.max(...weeklyData.map(d => d.duration), 60);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600">
            Distance: {data.distance} km
          </p>
          <p className="text-sm text-purple-600">
            Duration: {data.duration} min
          </p>
          <p className="text-sm text-gray-600">
            Activities: {data.activities}
          </p>
        </div>
      );
    }
    return null;
  };

  const totalWeekDistance = weeklyData.reduce((sum, day) => sum + day.distance, 0);
  const totalWeekDuration = weeklyData.reduce((sum, day) => sum + day.duration, 0);

  // Get week display info
  const getWeekInfo = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1 + (weekOffset * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const isCurrentWeek = weekOffset === 0;
    const weekLabel = isCurrentWeek ? 'This Week' : 
      weekOffset === -1 ? 'Last Week' : 
      `${Math.abs(weekOffset)} weeks ago`;
    
    const dateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    
    return { weekLabel, dateRange };
  };

  const { weekLabel, dateRange } = getWeekInfo();

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900">{weekLabel}</h4>
          <p className="text-sm text-gray-600">{dateRange}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
            leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            rightIcon={<ChevronRightIcon className="h-4 w-4" />}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{totalWeekDistance.toFixed(2)}</p>
          <p className="text-sm text-blue-700">km {weekOffset === 0 ? 'this week' : weekLabel.toLowerCase()}</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{Math.round(totalWeekDuration)}</p>
          <p className="text-sm text-purple-700">minutes {weekOffset === 0 ? 'this week' : weekLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              yAxisId="distance"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[0, maxDistance]}
            />
            <YAxis 
              yAxisId="duration"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              domain={[0, maxDuration]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="distance"
              dataKey="distance" 
              fill="#3b82f6" 
              name="Distance (km)"
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
            <Bar 
              yAxisId="duration"
              dataKey="duration" 
              fill="#8b5cf6" 
              name="Duration (min)"
              radius={[2, 2, 0, 0]}
              opacity={0.6}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Goals Progress */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Weekly Distance Goal</span>
            <span>{totalWeekDistance.toFixed(1)} / 25 km</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min((totalWeekDistance / 25) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Weekly Time Goal</span>
            <span>{Math.round(totalWeekDuration)} / 180 min</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min((totalWeekDuration / 180) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;