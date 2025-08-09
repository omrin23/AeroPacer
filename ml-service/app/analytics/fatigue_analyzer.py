import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sklearn.preprocessing import StandardScaler
import math

from ..models.data_models import ActivityData, FatigueAnalysis

class FatigueAnalyzer:
    """Analyzes fatigue and recovery needs based on training data"""
    
    def __init__(self):
        self.recovery_baseline = {
            'easy_run': 0.5,      # Recovery days needed per hour of easy running
            'moderate_run': 0.8,   # Recovery days needed per hour of moderate running  
            'hard_run': 1.2,      # Recovery days needed per hour of hard running
            'race': 2.0           # Recovery days needed per hour of racing
        }
        
        # Heart rate zones (as percentages of max HR)
        self.hr_zones = {
            'recovery': (0.50, 0.60),
            'easy': (0.60, 0.70),
            'aerobic': (0.70, 0.80),
            'threshold': (0.80, 0.90),
            'vo2max': (0.90, 1.00)
        }
    
    def analyze_fatigue(self, activities: List[ActivityData], user_profile: Dict[str, Any] = None) -> FatigueAnalysis:
        """
        Analyze current fatigue level and recovery needs
        
        Args:
            activities: List of recent activities
            user_profile: Optional user profile with age, gender, etc.
        """
        
        if not activities:
            return self._create_default_analysis("No activity data available")
        
        # Convert to DataFrame and filter recent activities
        df = self._activities_to_df(activities)
        recent_df = self._get_recent_activities(df, days=14)  # Last 2 weeks
        
        if recent_df.empty:
            return self._create_default_analysis("No recent activities found")
        
        # Calculate various fatigue indicators
        training_load_fatigue = self._calculate_training_load_fatigue(recent_df)
        intensity_fatigue = self._calculate_intensity_fatigue(recent_df)
        volume_fatigue = self._calculate_volume_fatigue(recent_df)
        recovery_debt = self._calculate_recovery_debt(recent_df)
        
        # Combine fatigue scores (weighted average)
        fatigue_components = {
            'training_load': training_load_fatigue,
            'intensity': intensity_fatigue,
            'volume': volume_fatigue,
            'recovery_debt': recovery_debt
        }
        
        weights = {'training_load': 0.3, 'intensity': 0.25, 'volume': 0.25, 'recovery_debt': 0.2}
        overall_fatigue = sum(score * weights[component] 
                             for component, score in fatigue_components.items())
        
        # Apply user-specific adjustments
        if user_profile:
            overall_fatigue = self._adjust_for_user_profile(overall_fatigue, user_profile)
        
        # Generate recommendations
        recovery_recommendation = self._generate_recovery_recommendation(overall_fatigue, recent_df)
        days_to_recovery = self._estimate_recovery_days(overall_fatigue, recent_df)
        training_readiness = self._assess_training_readiness(overall_fatigue)
        contributing_factors = self._identify_contributing_factors(fatigue_components, recent_df)
        
        return FatigueAnalysis(
            fatigue_score=min(100, max(0, overall_fatigue)),
            recovery_recommendation=recovery_recommendation,
            days_to_full_recovery=days_to_recovery,
            training_readiness=training_readiness,
            contributing_factors=contributing_factors
        )
    
    def _activities_to_df(self, activities: List[ActivityData]) -> pd.DataFrame:
        """Convert activities to DataFrame for analysis"""
        data = []
        for activity in activities:
            data.append({
                'type': activity.type,
                'distance': activity.distance,
                'duration': activity.duration,
                'average_pace': activity.average_pace,
                'start_date': activity.start_date,
                'is_race': activity.is_race,
                'average_heart_rate': activity.average_heart_rate,
                'max_heart_rate': activity.max_heart_rate,
                'elevation_gain': activity.elevation_gain or 0
            })
        
        df = pd.DataFrame(data)
        if not df.empty:
            # Normalize timezone to naive datetimes for consistent comparisons
            df['start_date'] = pd.to_datetime(df['start_date'], utc=False)
            if hasattr(df['start_date'].dt, 'tz') and df['start_date'].dt.tz is not None:
                df['start_date'] = df['start_date'].dt.tz_localize(None)
            df = df.sort_values('start_date')
            df['distance_km'] = df['distance'] / 1000
            df['duration_hours'] = df['duration'] / 3600
            df['days_ago'] = (datetime.now() - df['start_date']).dt.days
        
        return df
    
    def _get_recent_activities(self, df: pd.DataFrame, days: int = 14) -> pd.DataFrame:
        """Get activities from the last N days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        return df[df['start_date'] >= cutoff_date].copy()
    
    def _calculate_training_load_fatigue(self, df: pd.DataFrame) -> float:
        """Calculate fatigue based on training load (TRIMP-like score)"""
        if df.empty:
            return 0
        
        # Calculate training impulse for each activity
        training_loads = []
        
        for _, activity in df.iterrows():
            # Base load from duration
            base_load = activity['duration_hours'] * 100
            
            # Intensity factor from heart rate (if available)
            intensity_factor = 1.0
            if pd.notna(activity['average_heart_rate']):
                # Estimate intensity based on HR (simplified)
                estimated_max_hr = 220 - 30  # Assume 30 years old as default
                hr_percentage = activity['average_heart_rate'] / estimated_max_hr
                intensity_factor = self._hr_to_intensity_factor(hr_percentage)
            
            # Pace intensity factor (if available)
            elif pd.notna(activity['average_pace']):
                # Estimate intensity from pace (very simplified)
                # Faster pace = higher intensity
                pace_min_per_km = activity['average_pace'] / 60
                if pace_min_per_km < 4:  # Very fast
                    intensity_factor = 2.0
                elif pace_min_per_km < 5:  # Fast
                    intensity_factor = 1.5
                elif pace_min_per_km < 6:  # Moderate
                    intensity_factor = 1.2
                # Easy pace keeps factor at 1.0
            
            # Race multiplier
            if activity['is_race']:
                intensity_factor *= 1.5
            
            # Elevation factor
            elevation_factor = 1 + (activity['elevation_gain'] / 1000) * 0.2  # 20% per 1000m
            
            total_load = base_load * intensity_factor * elevation_factor
            training_loads.append(total_load)
        
        df['training_load'] = training_loads
        
        # Calculate acute vs chronic load ratio
        total_load = df['training_load'].sum()
        
        # Compare to expected "normal" load for 2 weeks (rough baseline)
        expected_load = 500  # Baseline expectation
        load_ratio = total_load / expected_load
        
        # Convert to fatigue score (higher load = higher fatigue)
        fatigue_score = min(100, load_ratio * 50)
        
        return fatigue_score
    
    def _calculate_intensity_fatigue(self, df: pd.DataFrame) -> float:
        """Calculate fatigue based on training intensity"""
        if df.empty:
            return 0
        
        # Count high-intensity sessions
        high_intensity_sessions = 0
        total_sessions = len(df)
        
        for _, activity in df.iterrows():
            if activity['is_race']:
                high_intensity_sessions += 2  # Races count double
            elif pd.notna(activity['average_heart_rate']):
                estimated_max_hr = 220 - 30
                hr_percentage = activity['average_heart_rate'] / estimated_max_hr
                if hr_percentage > 0.85:  # Threshold+ intensity
                    high_intensity_sessions += 1
            elif pd.notna(activity['average_pace']):
                pace_min_per_km = activity['average_pace'] / 60
                if pace_min_per_km < 4.5:  # Fast pace
                    high_intensity_sessions += 1
        
        # Calculate intensity fatigue
        intensity_ratio = high_intensity_sessions / max(1, total_sessions)
        
        # High intensity should be limited (80/20 rule)
        if intensity_ratio > 0.3:  # More than 30% high intensity
            fatigue_score = (intensity_ratio - 0.2) * 200  # Penalty for too much intensity
        else:
            fatigue_score = 0
        
        return min(100, fatigue_score)
    
    def _calculate_volume_fatigue(self, df: pd.DataFrame) -> float:
        """Calculate fatigue based on training volume"""
        if df.empty:
            return 0
        
        # Total volume in last 2 weeks
        total_distance = df['distance_km'].sum()
        total_time = df['duration_hours'].sum()
        
        # Weekly averages
        weekly_distance = total_distance / 2
        weekly_time = total_time / 2
        
        # Fatigue thresholds (rough guidelines)
        distance_fatigue = 0
        time_fatigue = 0
        
        # Distance-based fatigue
        if weekly_distance > 80:  # Very high volume
            distance_fatigue = 80
        elif weekly_distance > 60:  # High volume
            distance_fatigue = 60
        elif weekly_distance > 40:  # Moderate volume
            distance_fatigue = 30
        
        # Time-based fatigue
        if weekly_time > 8:  # Very high volume
            time_fatigue = 80
        elif weekly_time > 6:  # High volume
            time_fatigue = 60
        elif weekly_time > 4:  # Moderate volume
            time_fatigue = 30
        
        return max(distance_fatigue, time_fatigue)
    
    def _calculate_recovery_debt(self, df: pd.DataFrame) -> float:
        """Calculate accumulated recovery debt"""
        if df.empty:
            return 0
        
        total_debt = 0
        
        for _, activity in df.iterrows():
            # Calculate required recovery time for this activity
            required_recovery = self._calculate_required_recovery(activity)
            
            # Time since this activity
            days_since = activity['days_ago']
            
            # Recovery debt (if not enough time has passed)
            if days_since < required_recovery:
                debt = (required_recovery - days_since) / required_recovery
                total_debt += debt * 20  # Scale factor
        
        return min(100, total_debt)
    
    def _calculate_required_recovery(self, activity: pd.Series) -> float:
        """Calculate required recovery days for an activity"""
        base_recovery = activity['duration_hours'] * 0.5  # Base: 0.5 days per hour
        
        # Adjust for intensity
        if activity['is_race']:
            base_recovery *= 3  # Races need more recovery
        elif pd.notna(activity['average_heart_rate']):
            estimated_max_hr = 220 - 30
            hr_percentage = activity['average_heart_rate'] / estimated_max_hr
            if hr_percentage > 0.85:
                base_recovery *= 2  # High intensity needs more recovery
        
        # Adjust for distance
        if activity['distance_km'] > 25:  # Long run
            base_recovery *= 1.5
        
        return base_recovery
    
    def _hr_to_intensity_factor(self, hr_percentage: float) -> float:
        """Convert heart rate percentage to intensity factor"""
        if hr_percentage < 0.60:
            return 0.5  # Recovery
        elif hr_percentage < 0.70:
            return 1.0  # Easy
        elif hr_percentage < 0.80:
            return 1.5  # Aerobic
        elif hr_percentage < 0.90:
            return 2.0  # Threshold
        else:
            return 3.0  # VO2 max
    
    def _adjust_for_user_profile(self, fatigue_score: float, user_profile: Dict[str, Any]) -> float:
        """Adjust fatigue score based on user profile"""
        adjusted_score = fatigue_score
        
        # Age adjustment
        if 'age' in user_profile:
            age = user_profile.get('age')
            # Guard: only adjust if age is numeric
            if isinstance(age, (int, float)):
                if age > 50:
                    adjusted_score *= 1.2  # Older athletes need more recovery
                elif age < 25:
                    adjusted_score *= 0.9  # Younger athletes recover faster
        
        # Fitness level adjustment
        if 'fitness_level' in user_profile:
            fitness_level = user_profile.get('fitness_level')
            if isinstance(fitness_level, str):
                fitness = fitness_level.lower()
                if fitness == 'elite':
                    adjusted_score *= 0.8  # Elite athletes handle more load
                elif fitness == 'beginner':
                    adjusted_score *= 1.3  # Beginners fatigue more easily
        
        return adjusted_score
    
    def _generate_recovery_recommendation(self, fatigue_score: float, df: pd.DataFrame) -> str:
        """Generate recovery recommendation based on fatigue score"""
        if fatigue_score < 20:
            return "Low fatigue - ready for training. Consider adding intensity or volume."
        elif fatigue_score < 40:
            return "Moderate fatigue - maintain easy training. Focus on aerobic base building."
        elif fatigue_score < 60:
            return "High fatigue - prioritize recovery. Easy runs only, consider rest days."
        elif fatigue_score < 80:
            return "Very high fatigue - significant recovery needed. Take 2-3 rest days."
        else:
            return "Extreme fatigue - complete rest recommended. Consider consulting a coach."
    
    def _estimate_recovery_days(self, fatigue_score: float, df: pd.DataFrame) -> int:
        """Estimate days needed for full recovery"""
        if fatigue_score < 20:
            return 0
        elif fatigue_score < 40:
            return 1
        elif fatigue_score < 60:
            return 2
        elif fatigue_score < 80:
            return 4
        else:
            return 7
    
    def _assess_training_readiness(self, fatigue_score: float) -> str:
        """Assess current training readiness"""
        if fatigue_score < 30:
            return "high"
        elif fatigue_score < 60:
            return "medium"
        else:
            return "low"
    
    def _identify_contributing_factors(self, fatigue_components: Dict[str, float], df: pd.DataFrame) -> List[str]:
        """Identify main factors contributing to fatigue"""
        factors = []
        
        # Find the highest contributing factors
        sorted_components = sorted(fatigue_components.items(), key=lambda x: x[1], reverse=True)
        
        for component, score in sorted_components[:3]:  # Top 3 factors
            if score > 30:  # Significant contribution
                if component == 'training_load':
                    factors.append("High overall training load")
                elif component == 'intensity':
                    factors.append("Too much high-intensity training")
                elif component == 'volume':
                    factors.append("High training volume")
                elif component == 'recovery_debt':
                    factors.append("Insufficient recovery between sessions")
        
        # Check for recent race
        if not df.empty and df['is_race'].any():
            recent_race = df[df['is_race'] == True]['days_ago'].min()
            if recent_race <= 7:
                factors.append("Recent race effort")
        
        # Check for training consistency
        if len(df) > 5:
            activity_gaps = df['start_date'].diff().dt.days.dropna()
            if activity_gaps.max() <= 1:  # Training every day
                factors.append("Lack of rest days")
        
        return factors if factors else ["Normal training adaptations"]
    
    def _create_default_analysis(self, reason: str) -> FatigueAnalysis:
        """Create default analysis when no data available"""
        return FatigueAnalysis(
            fatigue_score=50,  # Moderate default
            recovery_recommendation=f"Unable to analyze fatigue: {reason}",
            days_to_full_recovery=1,
            training_readiness="medium",
            contributing_factors=[reason]
        )