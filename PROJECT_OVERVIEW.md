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

## Development Status

### ✅ Completed
- [x] Project structure planning
- [x] Tech stack decision
- [x] Complete project folder structure created
- [x] NestJS backend foundation with core modules
- [x] Next.js frontend foundation with modern setup
- [x] Python FastAPI ML service foundation
- [x] Docker development environment
- [x] Essential configuration files
- [x] Project documentation

### 🚧 In Progress
- None currently

### 📋 Next Todo
- [ ] Environment configuration setup
- [ ] Database schema implementation
- [ ] Strava API integration
- [ ] Basic dashboard with data visualization
- [ ] Analytics implementation
- [ ] AI coaching algorithms
- [ ] Deployment setup

## Getting Started
(To be updated as development progresses)

## Project Requirements
- Analytics integration (required for final project)
- AI/ML components for personalized coaching
- Real user data integration via APIs
- Performance tracking and visualization