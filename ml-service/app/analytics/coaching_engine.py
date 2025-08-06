import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random

from ..models.data_models import ActivityData, UserProfile, CoachingRecommendation, FatigueAnalysis, PerformancePrediction
from .data_processor import DataProcessor
from .performance_predictor import PerformancePredictor
from .fatigue_analyzer import FatigueAnalyzer

class CoachingEngine:
    """Main engine for generating personalized coaching recommendations"""
    
    def __init__(self):
        self.data_processor = DataProcessor()
        self.performance_predictor = PerformancePredictor()
        self.fatigue_analyzer = FatigueAnalyzer()
        
        # Training principles and guidelines
        self.training_principles = {
            'weekly_mileage_increase': 0.1,  # Max 10% increase per week
            'hard_easy_ratio': 0.2,          # 80/20 rule
            'long_run_percentage': 0.3,      # Long run should be max 30% of weekly mileage
            'recovery_days_per_week': 2,     # Minimum recovery days
        }
        
        # Coaching templates
        self.coaching_templates = {
            'volume': [
                "Consider increasing your weekly mileage gradually",
                "Your training volume is appropriate for your current fitness level",
                "Reduce training volume to prevent overtraining"
            ],
            'intensity': [
                "Add more speed work to improve your pace",
                "Focus on easy aerobic running to build your base",
                "Include threshold runs to improve your lactate clearance"
            ],
            'recovery': [
                "Take an extra rest day this week",
                "Focus on active recovery with easy pace runs",
                "Consider a massage or stretching session"
            ],
            'race_prep': [
                "Start tapering for your upcoming race",
                "Practice race pace during your long runs",
                "Focus on race nutrition and hydration strategies"
            ],
            'technique': [
                "Work on your running form and cadence",
                "Consider strength training to prevent injuries",
                "Practice hill running to build power"
            ]
        }
    
    def generate_coaching_insights(self, 
                                 activities: List[ActivityData],
                                 user_profile: Optional[UserProfile] = None,
                                 goals: Optional[List[str]] = None) -> List[CoachingRecommendation]:
        """
        Generate comprehensive coaching recommendations
        
        Args:
            activities: Recent training activities
            user_profile: Optional user profile data
            goals: Optional list of user goals
        
        Returns:
            List of personalized coaching recommendations
        """
        
        if not activities:
            return [self._create_recommendation(
                "Getting Started",
                "Start with 3-4 easy runs per week, 20-30 minutes each",
                "high",
                0.9,
                "training"
            )]
        
        # Analyze current state
        df = self.data_processor.activities_to_dataframe(activities)
        running_df = self.data_processor.calculate_running_metrics(df)
        
        # Get fatigue analysis
        fatigue_analysis = self.fatigue_analyzer.analyze_fatigue(activities, 
                                                               user_profile.__dict__ if user_profile else None)
        
        # Get training load analysis
        training_load = self.data_processor.calculate_training_load(running_df)
        
        # Get training trends
        trends = self.data_processor.get_training_trends(running_df)
        
        # Generate recommendations based on analysis
        recommendations = []
        
        # 1. Recovery and fatigue recommendations
        recovery_recs = self._generate_recovery_recommendations(fatigue_analysis)
        recommendations.extend(recovery_recs)
        
        # 2. Training load recommendations
        load_recs = self._generate_training_load_recommendations(training_load)
        recommendations.extend(load_recs)
        
        # 3. Performance and progression recommendations
        performance_recs = self._generate_performance_recommendations(running_df, trends)
        recommendations.extend(performance_recs)
        
        # 4. Goal-specific recommendations
        if goals:
            goal_recs = self._generate_goal_specific_recommendations(goals, running_df, activities)
            recommendations.extend(goal_recs)
        
        # 5. Training variety recommendations
        variety_recs = self._generate_variety_recommendations(running_df)
        recommendations.extend(variety_recs)
        
        # Sort by priority and confidence
        recommendations.sort(key=lambda x: (x.priority == 'high', x.confidence), reverse=True)
        
        # Return top recommendations (limit to avoid overwhelming)
        return recommendations[:8]
    
    def _generate_recovery_recommendations(self, fatigue_analysis: FatigueAnalysis) -> List[CoachingRecommendation]:
        """Generate recovery-specific recommendations"""
        recommendations = []
        
        if fatigue_analysis.fatigue_score > 70:
            recommendations.append(self._create_recommendation(
                "High Fatigue Alert",
                f"Your fatigue score is {fatigue_analysis.fatigue_score}/100. {fatigue_analysis.recovery_recommendation}",
                "high",
                0.9,
                "recovery",
                {"fatigue_score": fatigue_analysis.fatigue_score, "days_to_recovery": fatigue_analysis.days_to_full_recovery}
            ))
        elif fatigue_analysis.fatigue_score > 40:
            recommendations.append(self._create_recommendation(
                "Moderate Fatigue",
                "Consider adding more easy-paced runs and ensure adequate sleep",
                "medium",
                0.7,
                "recovery",
                {"fatigue_score": fatigue_analysis.fatigue_score}
            ))
        
        if fatigue_analysis.training_readiness == "low":
            recommendations.append(self._create_recommendation(
                "Training Readiness",
                "Your body needs more recovery before intense training. Focus on easy runs or rest.",
                "high",
                0.8,
                "recovery"
            ))
        
        return recommendations
    
    def _generate_training_load_recommendations(self, training_load) -> List[CoachingRecommendation]:
        """Generate training load specific recommendations"""
        recommendations = []
        
        if training_load.risk_level == "high":
            recommendations.append(self._create_recommendation(
                "Training Load Warning",
                f"Your acute:chronic load ratio is {training_load.ratio:.2f}. {training_load.recommendation}",
                "high",
                0.85,
                "training",
                {"load_ratio": training_load.ratio, "acute_load": training_load.acute_load}
            ))
        elif training_load.risk_level == "low" and training_load.ratio < 0.8:
            recommendations.append(self._create_recommendation(
                "Training Load Opportunity",
                "Your training load is low. Consider gradually increasing volume or intensity.",
                "medium",
                0.7,
                "training",
                {"load_ratio": training_load.ratio}
            ))
        
        return recommendations
    
    def _generate_performance_recommendations(self, df: pd.DataFrame, trends: Dict[str, Any]) -> List[CoachingRecommendation]:
        """Generate performance improvement recommendations"""
        recommendations = []
        
        if df.empty:
            return recommendations
        
        # Analyze pace trends
        if 'pace_min_per_km' in df.columns and len(df) >= 5:
            recent_paces = df.tail(5)['pace_min_per_km'].dropna()
            if len(recent_paces) >= 3:
                pace_trend = np.polyfit(range(len(recent_paces)), recent_paces, 1)[0]
                
                if pace_trend > 0.1:  # Getting slower
                    recommendations.append(self._create_recommendation(
                        "Pace Plateau",
                        "Your pace has been slowing lately. Consider adding tempo runs or checking your recovery.",
                        "medium",
                        0.75,
                        "pace",
                        {"pace_trend": pace_trend}
                    ))
                elif pace_trend < -0.1:  # Getting faster
                    recommendations.append(self._create_recommendation(
                        "Great Progress!",
                        "Your pace is improving! Keep up the consistent training.",
                        "low",
                        0.8,
                        "pace",
                        {"pace_trend": pace_trend}
                    ))
        
        # Analyze distance trends
        if trends and 'total_distance' in trends:
            weekly_distance = trends.get('total_distance', 0) / 4  # Rough weekly average
            
            if weekly_distance < 20:
                recommendations.append(self._create_recommendation(
                    "Build Your Base",
                    "Consider gradually increasing your weekly mileage to build aerobic fitness.",
                    "medium",
                    0.7,
                    "training",
                    {"weekly_distance": weekly_distance}
                ))
            elif weekly_distance > 80:
                recommendations.append(self._create_recommendation(
                    "High Volume Training",
                    "You're running high mileage. Ensure you're getting adequate recovery.",
                    "medium",
                    0.8,
                    "training",
                    {"weekly_distance": weekly_distance}
                ))
        
        # Check for training consistency
        if len(df) >= 10:
            date_diffs = df['start_date'].diff().dt.days.dropna()
            avg_gap = date_diffs.mean()
            
            if avg_gap > 3:
                recommendations.append(self._create_recommendation(
                    "Training Consistency",
                    "Try to run more consistently. Aim for 3-4 runs per week with no more than 2 days between runs.",
                    "medium",
                    0.7,
                    "training",
                    {"avg_gap_days": avg_gap}
                ))
            elif avg_gap < 1.2:
                recommendations.append(self._create_recommendation(
                    "Recovery Days",
                    "You're training very frequently. Make sure to include 1-2 complete rest days per week.",
                    "medium",
                    0.8,
                    "recovery",
                    {"avg_gap_days": avg_gap}
                ))
        
        return recommendations
    
    def _generate_goal_specific_recommendations(self, goals: List[str], df: pd.DataFrame, activities: List[ActivityData]) -> List[CoachingRecommendation]:
        """Generate recommendations based on user goals"""
        recommendations = []
        
        for goal in goals:
            goal_lower = goal.lower()
            
            if 'marathon' in goal_lower:
                # Marathon-specific advice
                if not df.empty:
                    max_distance = df['distance_km'].max() if 'distance_km' in df.columns else 0
                    if max_distance < 25:
                        recommendations.append(self._create_recommendation(
                            "Marathon Preparation",
                            "For marathon training, gradually build your long runs up to 32-35km.",
                            "high",
                            0.9,
                            "training",
                            {"current_max_distance": max_distance, "goal": goal}
                        ))
                    
                    weekly_volume = df['distance_km'].sum() / 4 if len(df) >= 4 else 0
                    if weekly_volume < 50:
                        recommendations.append(self._create_recommendation(
                            "Marathon Base Building",
                            "Build your weekly mileage to 60-80km for marathon preparation.",
                            "medium",
                            0.8,
                            "training",
                            {"current_weekly_volume": weekly_volume}
                        ))
            
            elif '5k' in goal_lower or '10k' in goal_lower:
                # 5K/10K specific advice
                recommendations.append(self._create_recommendation(
                    f"{goal} Training",
                    "Include weekly tempo runs and interval training to improve your speed.",
                    "medium",
                    0.8,
                    "training",
                    {"goal": goal}
                ))
            
            elif 'weight' in goal_lower or 'lose' in goal_lower:
                # Weight loss goal
                recommendations.append(self._create_recommendation(
                    "Weight Management",
                    "Combine easy-paced runs with strength training for optimal weight management.",
                    "medium",
                    0.7,
                    "training",
                    {"goal": goal}
                ))
            
            elif 'fitness' in goal_lower or 'health' in goal_lower:
                # General fitness
                recommendations.append(self._create_recommendation(
                    "General Fitness",
                    "Maintain 3-4 runs per week at comfortable pace for optimal health benefits.",
                    "low",
                    0.8,
                    "training",
                    {"goal": goal}
                ))
        
        return recommendations
    
    def _generate_variety_recommendations(self, df: pd.DataFrame) -> List[CoachingRecommendation]:
        """Generate recommendations for training variety"""
        recommendations = []
        
        if df.empty or len(df) < 5:
            return recommendations
        
        # Check for workout variety
        recent_runs = df.tail(10)
        
        # Check if all runs are similar distance
        if 'distance_km' in recent_runs.columns:
            distances = recent_runs['distance_km']
            distance_variety = distances.std() / distances.mean() if distances.mean() > 0 else 0
            
            if distance_variety < 0.3:  # Low variety
                recommendations.append(self._create_recommendation(
                    "Add Training Variety",
                    "Mix up your training with different distances - short runs, medium runs, and long runs.",
                    "low",
                    0.6,
                    "training",
                    {"distance_variety": distance_variety}
                ))
        
        # Check for speed work
        if 'pace_min_per_km' in recent_runs.columns:
            paces = recent_runs['pace_min_per_km'].dropna()
            if len(paces) >= 5:
                pace_variety = paces.std() / paces.mean() if paces.mean() > 0 else 0
                
                if pace_variety < 0.1:  # Very consistent pace
                    recommendations.append(self._create_recommendation(
                        "Add Speed Work",
                        "Include some faster-paced runs like tempo runs or intervals to improve your speed.",
                        "medium",
                        0.7,
                        "training",
                        {"pace_variety": pace_variety}
                    ))
        
        # Check for elevation training
        if 'elevation_gain' in recent_runs.columns:
            avg_elevation = recent_runs['elevation_gain'].mean()
            if avg_elevation < 50:  # Very flat running
                recommendations.append(self._create_recommendation(
                    "Hill Training",
                    "Add some hill training to build strength and power.",
                    "low",
                    0.6,
                    "training",
                    {"avg_elevation": avg_elevation}
                ))
        
        return recommendations
    
    def get_race_strategy(self, activities: List[ActivityData], race_distance: float, race_date: datetime) -> Dict[str, Any]:
        """Generate race strategy recommendations"""
        if not activities:
            return {"error": "No training data available for race strategy"}
        
        # Get performance prediction
        prediction = self.performance_predictor.predict_race_time(activities, race_distance)
        
        # Calculate days until race
        days_to_race = (race_date - datetime.now()).days
        
        # Generate strategy
        strategy = {
            "predicted_time": prediction.predicted_time,
            "confidence": prediction.confidence,
            "pacing_strategy": prediction.pacing_strategy,
            "taper_plan": self._generate_taper_plan(days_to_race),
            "race_day_tips": self._generate_race_day_tips(race_distance)
        }
        
        return strategy
    
    def _generate_taper_plan(self, days_to_race: int) -> List[Dict[str, str]]:
        """Generate a taper plan based on days to race"""
        if days_to_race <= 0:
            return [{"day": "Race Day", "plan": "Execute your race strategy!"}]
        
        taper_plan = []
        
        if days_to_race >= 14:  # 2+ weeks out
            taper_plan.append({
                "week": "2 weeks out",
                "plan": "Last week of full training. Include race pace practice."
            })
        
        if days_to_race >= 7:  # 1+ weeks out
            taper_plan.append({
                "week": "1 week out", 
                "plan": "Reduce volume by 30-40%. Keep some intensity but shorter duration."
            })
        
        if days_to_race >= 3:  # 3+ days out
            taper_plan.append({
                "days": "3-6 days out",
                "plan": "Easy runs only. Practice race nutrition and hydration."
            })
        
        if days_to_race >= 1:  # 1+ days out
            taper_plan.append({
                "days": "1-2 days out",
                "plan": "Complete rest or very easy 20-30 minute jog. Focus on sleep and nutrition."
            })
        
        return taper_plan
    
    def _generate_race_day_tips(self, race_distance: float) -> List[str]:
        """Generate race day tips based on distance"""
        tips = [
            "Start conservatively - you can always speed up later",
            "Stick to your planned nutrition and hydration strategy",
            "Focus on your form and breathing in the early miles"
        ]
        
        if race_distance <= 10000:  # 5K-10K
            tips.extend([
                "Warm up thoroughly with 10-15 minutes easy jogging",
                "Be ready to push through discomfort in the final third"
            ])
        else:  # Half marathon+
            tips.extend([
                "Don't go out too fast - save energy for the second half",
                "Take fuel and fluids at aid stations as planned",
                "Break the race into smaller segments mentally"
            ])
        
        return tips
    
    def _create_recommendation(self, 
                             title: str, 
                             message: str, 
                             priority: str, 
                             confidence: float, 
                             category: str,
                             data_points: Optional[Dict[str, Any]] = None) -> CoachingRecommendation:
        """Create a coaching recommendation"""
        return CoachingRecommendation(
            type="coaching_insight",
            title=title,
            message=message,
            priority=priority,
            confidence=confidence,
            category=category,
            data_points=data_points
        )