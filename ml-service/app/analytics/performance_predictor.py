import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from typing import List, Dict, Any, Optional
import joblib
from datetime import datetime, timedelta
import math

from ..models.data_models import ActivityData, PerformancePrediction
from .features import build_features_from_running_df, FEATURE_ORDER
import joblib
import os

class PerformancePredictor:
    """Predicts race performance based on training data using ML models"""
    
    def __init__(self):
        self.models = {
            'rf': RandomForestRegressor(n_estimators=100, random_state=42),
            'gb': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'lr': LinearRegression()
        }
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_names = []
        
        # Standard race distances (in meters)
        self.race_distances = {
            '5K': 5000,
            '10K': 10000,
            'Half Marathon': 21097.5,
            'Marathon': 42195
        }
        
        # VDOT/Performance equivalency tables (simplified)
        self.vdot_table = self._create_vdot_table()
        
        # Optional: load global trained model if available
        self.global_model = None
        self.global_model_features = FEATURE_ORDER
        self._global_model_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../models/global_performance_gbr.joblib")
        )
        # Try eager load if present
        self._try_load_global_model()

    def _try_load_global_model(self):
        if self.global_model is not None:
            return
        if os.path.exists(self._global_model_path):
            try:
                bundle = joblib.load(self._global_model_path)
                self.global_model = bundle.get("model")
                feats = bundle.get("feature_order")
                if isinstance(feats, list):
                    self.global_model_features = feats
            except Exception:
                self.global_model = None
    
    def _create_vdot_table(self) -> Dict[str, Dict[int, float]]:
        """Create simplified VDOT equivalency table"""
        # This is a simplified version - in production, use full Jack Daniels tables
        return {
            '5K': {40: 1500, 45: 1300, 50: 1150, 55: 1030, 60: 930, 65: 850},
            '10K': {40: 3120, 45: 2700, 50: 2400, 55: 2150, 60: 1950, 65: 1780},
            'Half Marathon': {40: 6840, 45: 5940, 50: 5280, 55: 4740, 60: 4290, 65: 3920},
            'Marathon': {40: 14400, 45: 12480, 50: 11100, 55: 9960, 60: 9000, 65: 8220}
        }
    
    def predict_race_time(self, 
                         activities: List[ActivityData], 
                         race_distance: float,
                         race_type: str = None) -> PerformancePrediction:
        """
        Predict race time based on recent training data
        
        Args:
            activities: List of recent activities
            race_distance: Distance in meters
            race_type: Optional race type (5K, 10K, etc.)
        """
        
        if not activities:
            return self._create_default_prediction(race_distance, "No training data available")
        
        # Convert to DataFrame and analyze
        df = self._activities_to_df(activities)
        running_df = df[df['type'] == 'Run'].copy()
        
        if running_df.empty:
            return self._create_default_prediction(race_distance, "No running activities found")
        
        # Calculate recent performance metrics
        recent_performance = self._calculate_recent_performance(running_df)
        
        # Use multiple prediction methods and ensemble
        predictions = {}
        
        # Method 1: VDOT-based prediction using best recent performance
        predictions['vdot'] = self._predict_using_vdot(running_df, race_distance)
        
        # Method 2: Pace progression analysis
        predictions['pace_trend'] = self._predict_using_pace_trend(running_df, race_distance)
        
        # Method 3: Distance/time relationship modeling
        predictions['distance_model'] = self._predict_using_distance_model(running_df, race_distance)
        
        # Method 0 (optional): Global trained model
        # Ensure model is loaded if it became available after startup
        self._try_load_global_model()
        if self.global_model is not None:
            # Build compact features from last 28/14/7 days window
            # Reuse the DataFrame already made
            from .data_processor import DataProcessor
            dp = DataProcessor()
            running_df = dp.calculate_running_metrics(df)
            fdict = build_features_from_running_df(running_df, reference_time=datetime.now(), race_distance_m=race_distance)
            x = np.array([[fdict.get(name, 0.0) for name in self.global_model_features]], dtype=float)
            try:
                predictions['global_ml'] = float(self.global_model.predict(x)[0])
            except Exception:
                predictions['global_ml'] = 0

        # Ensemble prediction (weighted average)
        weights = {'global_ml': 0.5, 'vdot': 0.25, 'pace_trend': 0.15, 'distance_model': 0.10}
        
        final_prediction = sum(pred * weights.get(method, 0) 
                             for method, pred in predictions.items() 
                             if pred > 0)
        
        if final_prediction <= 0:
            return self._create_default_prediction(race_distance, "Insufficient data for accurate prediction")
        
        # Generate confidence interval (±10% based on training consistency)
        consistency_factor = self._calculate_consistency_factor(running_df)
        margin = final_prediction * (0.05 + 0.05 * (1 - consistency_factor))
        
        confidence_interval = {
            'min': final_prediction - margin,
            'max': final_prediction + margin
        }
        
        # Generate pacing strategy
        pacing_strategy = self._generate_pacing_strategy(final_prediction, race_distance)
        
        # Calculate confidence score
        confidence = self._calculate_prediction_confidence(running_df, predictions)
        
        return PerformancePrediction(
            race_distance=race_distance,
            predicted_time=final_prediction,
            confidence_interval=confidence_interval,
            pacing_strategy=pacing_strategy,
            confidence=confidence
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
                'race_type': activity.race_type,
                'average_heart_rate': activity.average_heart_rate,
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
            df['pace_min_per_km'] = df['average_pace'] / 60 if 'average_pace' in df.columns else None
        
        return df
    
    def _calculate_recent_performance(self, df: pd.DataFrame, days: int = 60) -> Dict[str, Any]:
        """Calculate recent performance metrics"""
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_df = df[df['start_date'] >= cutoff_date]
        
        if recent_df.empty:
            return {}
        
        return {
            'best_pace': recent_df['pace_min_per_km'].min() if 'pace_min_per_km' in recent_df.columns else None,
            'avg_pace': recent_df['pace_min_per_km'].mean() if 'pace_min_per_km' in recent_df.columns else None,
            'longest_run': recent_df['distance_km'].max(),
            'avg_distance': recent_df['distance_km'].mean(),
            'total_volume': recent_df['distance_km'].sum(),
            'run_count': len(recent_df)
        }
    
    def _predict_using_vdot(self, df: pd.DataFrame, race_distance: float) -> float:
        """Predict using VDOT equivalency (simplified)"""
        # Find best recent performance (fastest pace for significant distance)
        significant_runs = df[df['distance_km'] >= 3]  # At least 3km
        
        if significant_runs.empty or 'pace_min_per_km' not in significant_runs.columns:
            return 0
        
        best_pace = significant_runs['pace_min_per_km'].min()  # min/km
        
        if pd.isna(best_pace):
            return 0
        
        # Estimate VDOT based on best pace (simplified calculation)
        # This is a simplified version - in production, use full Jack Daniels formulas
        estimated_vdot = max(35, min(70, 80 - (best_pace - 3) * 5))
        
        # Predict race time based on VDOT
        if race_distance == 5000:  # 5K
            return best_pace * 5 * 0.98  # Slightly faster than training pace
        elif race_distance == 10000:  # 10K
            return best_pace * 10 * 1.02  # Slightly slower than 5K pace
        elif race_distance == 21097.5:  # Half Marathon
            return best_pace * 21.1 * 1.08  # Slower for longer distance
        elif race_distance == 42195:  # Marathon
            return best_pace * 42.2 * 1.15  # Much slower for marathon
        else:
            # Linear interpolation for other distances
            pace_adjustment = 1 + (race_distance / 10000) * 0.02
            return best_pace * (race_distance / 1000) * pace_adjustment
    
    def _predict_using_pace_trend(self, df: pd.DataFrame, race_distance: float) -> float:
        """Predict based on pace improvement trend"""
        if len(df) < 5 or 'pace_min_per_km' not in df.columns:
            return 0
        
        # Analyze pace trend over recent runs
        recent_paces = df.tail(10)['pace_min_per_km'].dropna()
        
        if len(recent_paces) < 3:
            return 0
        
        # Calculate trend (improvement rate)
        x = np.arange(len(recent_paces))
        y = recent_paces.values
        
        # Linear regression to find trend
        if len(x) > 1:
            slope = np.polyfit(x, y, 1)[0]
            current_pace = recent_paces.iloc[-1]
            
            # Project pace improvement
            projected_pace = current_pace + slope * 2  # Project 2 steps ahead
            
            # Adjust for race distance
            race_pace = projected_pace * (1 + (race_distance / 50000))  # Adjustment factor
            
            return race_pace * (race_distance / 1000)
        
        return 0
    
    def _predict_using_distance_model(self, df: pd.DataFrame, race_distance: float) -> float:
        """Predict using distance/time relationship modeling"""
        if len(df) < 3:
            return 0
        
        # Use runs of various distances to model pace vs distance relationship
        distance_pace_data = df[['distance_km', 'pace_min_per_km']].dropna()
        
        if len(distance_pace_data) < 3:
            return 0
        
        # Model: pace = base_pace + distance_factor * distance
        distances = distance_pace_data['distance_km'].values
        paces = distance_pace_data['pace_min_per_km'].values
        
        # Simple linear regression
        if len(distances) > 1:
            coeffs = np.polyfit(distances, paces, 1)
            distance_factor, base_pace = coeffs
            
            # Predict pace for race distance
            race_distance_km = race_distance / 1000
            predicted_pace = base_pace + distance_factor * race_distance_km
            
            return predicted_pace * race_distance_km
        
        return 0
    
    def _calculate_consistency_factor(self, df: pd.DataFrame) -> float:
        """Calculate training consistency factor (0-1, higher is better)"""
        if len(df) < 5 or 'pace_min_per_km' not in df.columns:
            return 0.5
        
        recent_paces = df.tail(10)['pace_min_per_km'].dropna()
        
        if len(recent_paces) < 3:
            return 0.5
        
        # Calculate coefficient of variation (lower is more consistent)
        cv = recent_paces.std() / recent_paces.mean()
        
        # Convert to consistency factor (0-1)
        consistency = max(0, min(1, 1 - cv))
        
        return consistency
    
    def _generate_pacing_strategy(self, predicted_time: float, race_distance: float) -> List[Dict[str, float]]:
        """Generate pacing strategy for the race"""
        race_distance_km = race_distance / 1000
        target_pace = predicted_time / race_distance_km  # min/km
        
        # Generate split recommendations (every km or mile)
        splits = []
        
        if race_distance <= 10000:  # 5K-10K: more aggressive start
            for km in range(1, int(race_distance_km) + 1):
                if km == 1:
                    pace = target_pace * 0.98  # Start slightly faster
                elif km == int(race_distance_km):
                    pace = target_pace * 0.95  # Finish strong
                else:
                    pace = target_pace
                
                splits.append({
                    'distance': km,
                    'target_pace': round(pace, 2),
                    'cumulative_time': round(pace * km, 1)
                })
        else:  # Half marathon+: conservative start
            for km in range(1, int(race_distance_km) + 1):
                if km <= 3:
                    pace = target_pace * 1.02  # Start conservatively
                elif km > race_distance_km * 0.8:
                    pace = target_pace * 0.98  # Pick up pace in final 20%
                else:
                    pace = target_pace
                
                splits.append({
                    'distance': km,
                    'target_pace': round(pace, 2), 
                    'cumulative_time': round(sum(s['target_pace'] for s in splits) + pace, 1)
                })
        
        return splits
    
    def _calculate_prediction_confidence(self, df: pd.DataFrame, predictions: Dict[str, float]) -> float:
        """Calculate confidence in prediction based on data quality and model agreement"""
        confidence_factors = []
        
        # Factor 1: Amount of training data
        data_factor = min(1.0, len(df) / 20)  # Max confidence with 20+ runs
        confidence_factors.append(data_factor)
        
        # Factor 2: Recency of data
        if not df.empty:
            days_since_last = (datetime.now() - df['start_date'].max()).days
            recency_factor = max(0.3, 1 - days_since_last / 30)  # Decay over 30 days
            confidence_factors.append(recency_factor)
        
        # Factor 3: Agreement between prediction methods
        valid_predictions = [p for p in predictions.values() if p > 0]
        if len(valid_predictions) > 1:
            cv = np.std(valid_predictions) / np.mean(valid_predictions)
            agreement_factor = max(0.2, 1 - cv)  # High agreement = low coefficient of variation
            confidence_factors.append(agreement_factor)
        
        return np.mean(confidence_factors)
    
    def _create_default_prediction(self, race_distance: float, reason: str) -> PerformancePrediction:
        """Create a default prediction when insufficient data"""
        # Very rough estimate based on average recreational runner
        estimated_pace = 6.0  # 6 min/km average pace
        estimated_time = (race_distance / 1000) * estimated_pace * 60  # in seconds
        
        return PerformancePrediction(
            race_distance=race_distance,
            predicted_time=estimated_time,
            confidence_interval={'min': estimated_time * 0.9, 'max': estimated_time * 1.2},
            pacing_strategy=[],
            confidence=0.1  # Very low confidence
        )