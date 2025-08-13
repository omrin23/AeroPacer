from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv
import httpx
import traceback

from .models.data_models import (
    ActivityData, UserProfile, CoachingRecommendation, 
    PerformancePrediction, FatigueAnalysis, TrainingLoad
)
from .analytics.coaching_engine import CoachingEngine
from .analytics.performance_predictor import PerformancePredictor
from .analytics.fatigue_analyzer import FatigueAnalyzer
from .analytics.data_processor import DataProcessor
from .data.synthetic_generator import generate_dataset
from .analytics.train_global_model import train_from_directory

load_dotenv()

app = FastAPI(
    title="AeroPacer ML Service",
    description="AI/ML microservice for running analytics and coaching predictions",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("BACKEND_URL", "http://localhost:3001"),
        "http://localhost:3000",  # Frontend
        "http://127.0.0.1:3000",  # Frontend via 127.0.0.1
        "http://frontend:3000"   # Docker frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML components
coaching_engine = CoachingEngine()
performance_predictor = PerformancePredictor()
fatigue_analyzer = FatigueAnalyzer()
data_processor = DataProcessor()

# Pydantic models for API endpoints
from pydantic import BaseModel

class CoachingRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    user_profile: Optional[UserProfile] = None
    goals: Optional[List[str]] = None

class PerformancePredictionRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    race_distance: float
    race_type: Optional[str] = None

class FatigueAnalysisRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    user_profile: Optional[Dict[str, Any]] = None

class RaceStrategyRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    race_distance: float
    race_date: datetime

class TrainingPlanRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    user_profile: Optional[UserProfile] = None
    goals: Optional[List[str]] = None
    weeks: Optional[int] = 4
    race_distance: Optional[float] = None
    race_date: Optional[datetime] = None
    target_time_s: Optional[int] = None

class NextWorkoutRequest(BaseModel):
    user_id: str
    activities: List[ActivityData]
    user_profile: Optional[UserProfile] = None
    goals: Optional[List[str]] = None
    race_distance: Optional[float] = None
    race_date: Optional[datetime] = None
    target_time_s: Optional[int] = None

@app.get("/")
async def root():
    return {
        "message": "AeroPacer ML Service 🤖🏃‍♂️",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "coaching": "/coaching/recommendations",
            "performance": "/performance/predict",
            "fatigue": "/fatigue/analyze",
            "race_strategy": "/race/strategy",
            "training_load": "/training/load"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "OK",
        "service": "AeroPacer ML Service",
        "capabilities": [
            "performance_prediction",
            "fatigue_analysis", 
            "coaching_recommendations",
            "race_strategy",
            "training_load_analysis"
        ],
        "models_loaded": True,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/coaching/recommendations", response_model=List[CoachingRecommendation])
async def get_coaching_recommendations(request: CoachingRequest):
    """
    Generate personalized coaching recommendations based on training data
    """
    try:
        recommendations = coaching_engine.generate_coaching_insights(
            activities=request.activities,
            user_profile=request.user_profile,
            goals=request.goals
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating coaching recommendations: {str(e)}")

@app.post("/performance/predict", response_model=PerformancePrediction)
async def predict_performance(request: PerformancePredictionRequest):
    """
    Predict race performance based on training data
    """
    try:
        prediction = performance_predictor.predict_race_time(
            activities=request.activities,
            race_distance=request.race_distance,
            race_type=request.race_type
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting performance: {str(e)}")

@app.post("/fatigue/analyze", response_model=FatigueAnalysis) 
async def analyze_fatigue(request: FatigueAnalysisRequest):
    """
    Analyze current fatigue level and recovery needs
    """
    try:
        analysis = fatigue_analyzer.analyze_fatigue(
            activities=request.activities,
            user_profile=request.user_profile
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing fatigue: {str(e)}")

@app.post("/race/strategy")
async def get_race_strategy(request: RaceStrategyRequest):
    """
    Generate race strategy and pacing recommendations
    """
    try:
        strategy = coaching_engine.get_race_strategy(
            activities=request.activities,
            race_distance=request.race_distance,
            race_date=request.race_date
        )
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating race strategy: {str(e)}")

@app.post("/training/load", response_model=TrainingLoad)
async def analyze_training_load(request: FatigueAnalysisRequest):
    """
    Analyze training load and stress balance
    """
    try:
        # Convert activities to DataFrame
        df = data_processor.activities_to_dataframe(request.activities)
        running_df = data_processor.calculate_running_metrics(df)
        
        # Calculate training load
        training_load = data_processor.calculate_training_load(running_df)
        return training_load
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing training load: {str(e)}")

@app.post("/training/plan")
async def generate_training_plan(request: TrainingPlanRequest):
    """Generate a multi-week training plan."""
    try:
        plan = coaching_engine.generate_training_plan(
            activities=request.activities,
            user_profile=request.user_profile,
            goals=request.goals,
            weeks=request.weeks or 4,
            race_distance=request.race_distance,
            race_date=request.race_date,
            target_time_s=request.target_time_s,
        )
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating training plan: {str(e)}")

@app.post("/workout/next")
async def suggest_next_workout(request: NextWorkoutRequest):
    """Suggest the next workout based on fatigue and recent training."""
    try:
        workout = coaching_engine.suggest_next_workout(
            activities=request.activities,
            user_profile=request.user_profile,
            goals=request.goals,
            race_distance=request.race_distance,
            race_date=request.race_date,
            target_time_s=request.target_time_s,
        )
        return workout
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error suggesting next workout: {str(e)}")

@app.get("/training/trends/{user_id}")
async def get_training_trends(user_id: str, days: int = 30):
    """
    Get training trends analysis for a user
    """
    try:
        # In a real implementation, this would fetch data from the backend
        # For now, return a placeholder
        return {
            "user_id": user_id,
            "analysis_period_days": days,
            "message": "Training trends analysis requires activity data. Use POST endpoints with activity data."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting training trends: {str(e)}")

@app.get("/models/status")
async def get_model_status():
    """
    Get status of ML models and analytics components
    """
    return {
        "coaching_engine": "ready",
        "performance_predictor": "ready", 
        "fatigue_analyzer": "ready",
        "data_processor": "ready",
        "capabilities": {
            "coaching_recommendations": True,
            "performance_prediction": True,
            "fatigue_analysis": True,
            "race_strategy": True,
            "training_load_analysis": True
        },
        "supported_race_distances": ["5K", "10K", "Half Marathon", "Marathon"],
        "min_activities_for_analysis": 3
    }

@app.post("/dev/synthetic/generate")
async def dev_generate_synthetic(n_users: int = 200):
    """
    Generate synthetic activities and race labels into app/data.
    Returns file paths. For development use.
    """
    try:
        act_path, race_path = generate_dataset(n_users=n_users)
        return {"success": True, "activities": act_path, "races": race_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Synthetic generation failed: {str(e)}")

@app.post("/dev/model/train")
async def dev_train_global_model():
    """
    Train the global model from synthetic dataset in app/data.
    Returns training metrics and model path. For development use.
    """
    try:
        # app/ is here, so app/data is synthetic; repo-level data is ../../data
        data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "./data"))
        repo_data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..", "data"))
        kaggle_dir = repo_data_dir if os.path.exists(os.path.join(repo_data_dir, "s1_summaries.csv")) else None
        info = train_from_directory(data_dir, kaggle_dir=kaggle_dir)
        return {"success": True, **info}
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}\n{traceback.format_exc()}")

# Test endpoint for development
@app.post("/test/sample-data")
async def test_with_sample_data():
    """
    Test ML service with sample running data
    """
    try:
        # Create sample activities
        sample_activities = [
            ActivityData(
                id="test1",
                user_id="test_user",
                name="Morning Run",
                type="Run",
                distance=5000,  # 5km
                duration=1800,  # 30 minutes
                average_pace=360,  # 6 min/km
                start_date=datetime.now(),
                average_heart_rate=150
            ),
            ActivityData(
                id="test2", 
                user_id="test_user",
                name="Long Run",
                type="Run",
                distance=15000,  # 15km
                duration=5400,  # 90 minutes
                average_pace=360,  # 6 min/km
                start_date=datetime.now(),
                average_heart_rate=140
            )
        ]
        
        # Test coaching recommendations
        recommendations = coaching_engine.generate_coaching_insights(sample_activities)
        
        # Test performance prediction for 10K
        prediction = performance_predictor.predict_race_time(sample_activities, 10000)
        
        # Test fatigue analysis
        fatigue = fatigue_analyzer.analyze_fatigue(sample_activities)
        
        return {
            "sample_data_generated": True,
            "activities_count": len(sample_activities),
            "coaching_recommendations": len(recommendations),
            "performance_prediction": {
                "predicted_time_minutes": prediction.predicted_time / 60,
                "confidence": prediction.confidence
            },
            "fatigue_analysis": {
                "fatigue_score": fatigue.fatigue_score,
                "training_readiness": fatigue.training_readiness
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)