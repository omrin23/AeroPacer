from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ActivityType(str, Enum):
    RUN = "Run"
    WALK = "Walk"
    HIKE = "Hike"
    RIDE = "Ride"

class WeatherData(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    conditions: Optional[str] = None

class SplitData(BaseModel):
    distance: float
    time: float
    pace: float

class ActivityData(BaseModel):
    id: str
    user_id: str
    strava_id: Optional[str] = None
    name: str
    type: ActivityType
    distance: float  # in meters
    duration: int  # in seconds
    average_pace: Optional[float] = None  # seconds per km
    max_pace: Optional[float] = None
    elevation_gain: Optional[float] = None  # in meters
    average_heart_rate: Optional[float] = None
    max_heart_rate: Optional[float] = None
    average_cadence: Optional[float] = None
    start_date: datetime
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    end_latitude: Optional[float] = None
    end_longitude: Optional[float] = None
    splits: Optional[List[SplitData]] = None
    weather: Optional[WeatherData] = None
    is_race: bool = False
    race_type: Optional[str] = None
    description: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    age: Optional[int] = None
    gender: Optional[str] = None
    weight: Optional[float] = None  # in kg
    height: Optional[float] = None  # in cm
    fitness_level: Optional[str] = None
    goals: Optional[List[str]] = None

class CoachingRecommendation(BaseModel):
    type: str
    title: str
    message: str
    priority: str  # high, medium, low
    confidence: float  # 0-1
    category: str  # training, recovery, pace, etc.
    data_points: Optional[Dict[str, Any]] = None

class PerformancePrediction(BaseModel):
    race_distance: float  # in meters
    predicted_time: float  # in seconds
    confidence_interval: Dict[str, float]  # min/max estimates
    pacing_strategy: List[Dict[str, float]]
    confidence: float

class FatigueAnalysis(BaseModel):
    fatigue_score: float  # 0-100
    recovery_recommendation: str
    days_to_full_recovery: int
    training_readiness: str  # high, medium, low
    contributing_factors: List[str]

class TrainingLoad(BaseModel):
    acute_load: float  # 7-day average
    chronic_load: float  # 28-day average
    ratio: float  # acute/chronic
    risk_level: str  # low, moderate, high
    recommendation: str