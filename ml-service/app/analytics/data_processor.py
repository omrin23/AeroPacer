import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..models.data_models import ActivityData, UserProfile, TrainingLoad

class DataProcessor:
    """Processes raw activity data for ML model consumption"""
    
    def __init__(self):
        self.min_activities_for_analysis = 3
    
    def activities_to_dataframe(self, activities: List[ActivityData]) -> pd.DataFrame:
        """Convert list of activities to pandas DataFrame"""
        data = []
        for activity in activities:
            data.append({
                'id': activity.id,
                'user_id': activity.user_id,
                'name': activity.name,
                'type': activity.type,
                'distance': activity.distance,
                'duration': activity.duration,
                'average_pace': activity.average_pace,
                'max_pace': activity.max_pace,
                'elevation_gain': activity.elevation_gain or 0,
                'average_heart_rate': activity.average_heart_rate,
                'max_heart_rate': activity.max_heart_rate,
                'average_cadence': activity.average_cadence,
                'start_date': activity.start_date,
                'is_race': activity.is_race,
                'race_type': activity.race_type,
                'temperature': activity.weather.temperature if activity.weather else None,
                'humidity': activity.weather.humidity if activity.weather else None,
                'wind_speed': activity.weather.wind_speed if activity.weather else None,
            })
        
        df = pd.DataFrame(data)
        if not df.empty:
            # Normalize to timezone-naive datetimes to avoid tz-aware vs tz-naive comparisons
            df['start_date'] = pd.to_datetime(df['start_date'], utc=False)
            # If parsed as tz-aware (e.g., from 'Z'), strip timezone info
            if hasattr(df['start_date'].dt, 'tz') and df['start_date'].dt.tz is not None:
                df['start_date'] = df['start_date'].dt.tz_localize(None)
            df = df.sort_values('start_date')
        
        return df
    
    def calculate_running_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived metrics for running analysis"""
        if df.empty:
            return df
        
        # Filter only running activities
        running_df = df[df['type'] == 'Run'].copy()
        
        if running_df.empty:
            return running_df
        
        # Calculate pace (min/km) from average_pace (sec/km)
        running_df['pace_min_per_km'] = running_df['average_pace'] / 60
        
        # Calculate speed (km/h)
        running_df['speed_kmh'] = 3600 / running_df['average_pace']
        
        # Distance in km
        running_df['distance_km'] = running_df['distance'] / 1000
        
        # Duration in minutes
        running_df['duration_min'] = running_df['duration'] / 60
        
        # Training stress score estimation (simplified)
        running_df['effort_score'] = self._calculate_effort_score(running_df)
        
        # Weekly aggregations
        running_df['week'] = running_df['start_date'].dt.isocalendar().week
        running_df['year'] = running_df['start_date'].dt.year
        
        # Rolling averages
        running_df = running_df.sort_values('start_date')
        running_df['avg_pace_7d'] = running_df['pace_min_per_km'].rolling(window=7, min_periods=1).mean()
        running_df['avg_distance_7d'] = running_df['distance_km'].rolling(window=7, min_periods=1).mean()
        running_df['total_distance_7d'] = running_df['distance_km'].rolling(window=7, min_periods=1).sum()
        
        return running_df
    
    def _calculate_effort_score(self, df: pd.DataFrame) -> pd.Series:
        """Calculate a training effort score based on duration, pace, and heart rate"""
        # Base score from duration (minutes)
        effort = df['duration_min'].copy()
        
        # Adjust for intensity (heart rate if available)
        if 'average_heart_rate' in df.columns and not df['average_heart_rate'].isna().all():
            hr_factor = df['average_heart_rate'] / df['average_heart_rate'].max()
            effort *= (1 + hr_factor)
        
        # Adjust for elevation
        if 'elevation_gain' in df.columns:
            elevation_factor = df['elevation_gain'] / 100  # 100m = 1x multiplier
            effort *= (1 + elevation_factor * 0.1)  # 10% increase per 100m
        
        return effort
    
    def calculate_training_load(self, df: pd.DataFrame) -> TrainingLoad:
        """Calculate acute and chronic training loads"""
        if df.empty or len(df) < 7:
            return TrainingLoad(
                acute_load=0,
                chronic_load=0,
                ratio=0,
                risk_level="low",
                recommendation="Need more training data for accurate analysis"
            )
        
        # Sort by date
        df = df.sort_values('start_date')
        
        # Calculate daily training loads
        df['date'] = df['start_date'].dt.date
        daily_loads = df.groupby('date')['effort_score'].sum()
        
        # Ensure we have recent data
        end_date = daily_loads.index.max()
        start_date = end_date - timedelta(days=28)
        
        # Fill missing days with 0
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        daily_loads = daily_loads.reindex(date_range.date, fill_value=0)
        
        # Calculate loads
        acute_load = daily_loads.tail(7).mean()  # Last 7 days
        chronic_load = daily_loads.tail(28).mean()  # Last 28 days
        
        # Training stress ratio (acute:chronic)
        ratio = acute_load / chronic_load if chronic_load > 0 else 0
        
        # Risk assessment
        if ratio < 0.8:
            risk_level = "low"
            recommendation = "Consider gradually increasing training volume"
        elif ratio > 1.3:
            risk_level = "high"
            recommendation = "High training stress - consider rest or easy training"
        else:
            risk_level = "moderate"
            recommendation = "Good training balance - maintain current approach"
        
        return TrainingLoad(
            acute_load=float(acute_load),
            chronic_load=float(chronic_load),
            ratio=float(ratio),
            risk_level=risk_level,
            recommendation=recommendation
        )
    
    def get_training_trends(self, df: pd.DataFrame, days: int = 30) -> Dict[str, Any]:
        """Analyze training trends over specified period"""
        if df.empty:
            return {}
        
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_df = df[df['start_date'] >= cutoff_date]
        
        if recent_df.empty:
            return {}
        
        # Weekly aggregations
        weekly_stats = recent_df.groupby([recent_df['start_date'].dt.year, 
                                        recent_df['start_date'].dt.isocalendar().week]).agg({
            'distance_km': ['sum', 'mean'],
            'duration_min': 'sum',
            'pace_min_per_km': 'mean',
            'effort_score': 'sum'
        }).round(2)
        
        return {
            'total_runs': len(recent_df),
            'total_distance': float(recent_df['distance_km'].sum()),
            'total_time': float(recent_df['duration_min'].sum()),
            'avg_pace': float(recent_df['pace_min_per_km'].mean()),
            'weekly_distance_trend': weekly_stats['distance_km']['sum'].tolist(),
            'weekly_effort_trend': weekly_stats['effort_score']['sum'].tolist(),
        }
    
    def prepare_features_for_ml(self, df: pd.DataFrame) -> np.ndarray:
        """Prepare feature matrix for ML models"""
        if df.empty:
            return np.array([])
        
        # Select features for ML
        features = [
            'distance_km',
            'duration_min', 
            'pace_min_per_km',
            'elevation_gain',
            'effort_score'
        ]
        
        # Add heart rate if available
        if 'average_heart_rate' in df.columns and not df['average_heart_rate'].isna().all():
            features.append('average_heart_rate')
        
        # Fill missing values
        feature_df = df[features].fillna(df[features].median())
        
        return feature_df.values