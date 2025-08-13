# AeroPacer - AI-Powered Running Analytics Platform

## Project Description
AeroPacer connects with running and health data (Strava, Apple Health, etc.) to generate personalized coaching insights. It analyzes performance, fatigue, hydration, and recovery, and helps runners plan race strategies and avoid overtraining.

## Key Features
- **Data Integration**: Strava API, Apple Health data import
- **AI Coaching**: Neural network predictions for personalized insights
- **Performance Analytics**: Performance, fatigue, hydration, and recovery analysis
- **Race Planning**: Race simulator and strategy planning
- **Health Monitoring**: Fatigue alerts and overtraining prevention
- **Season Planning**: Long-term training periodization

## Tech Stack

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **APIs**: Strava API integration
- **Auth**: JWT authentication

### Frontend (Next.js)
- **Framework**: Next.js 14 with React
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **PWA**: Progressive Web App capabilities

### AI/ML Service (Python)
- **Framework**: FastAPI
- **ML**: scikit-learn, PyTorch/TensorFlow
- **Analysis**: Performance prediction and coaching algorithms

### Analytics
- **Mixpanel**: User behavior tracking
- **Custom Events**: Running metrics tracking

## Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   NestJS API    │
│   Frontend      │◄──►│   (Main Backend)│
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Python ML      │
                       │  Service        │
                       │  (FastAPI)      │
                       └─────────────────┘
```

## Current Capabilities

- Authentication (register/login/refresh/logout, profile)
- Strava OAuth (connect, callback, disconnect, connection status, activities sync + extended sync)
- ML integration: coaching recommendations, performance prediction, fatigue analysis, training load, race strategy, training plan, next workout
- Analytics: server-side Mixpanel integration and custom event/page tracking endpoints
- Dockerized dev environment (Postgres, Redis, services)

## Getting Started
See `SETUP_GUIDE.md` and `START_SERVICES.md`.

## Project Requirements
- Analytics integration (required for final project)
- AI/ML components for personalized coaching
- Real user data integration via APIs
- Performance tracking and visualization