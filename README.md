# AeroPacer 🏃‍♂️💨

**AI-Powered Running Analytics & Personalized Coaching Platform**

AeroPacer connects with running and health data (Strava, Apple Health, etc.) to generate personalized coaching insights using neural network predictions and advanced analytics.

## 🏗️ Project Structure

```
AeroPacer/
├── backend/                 # NestJS API Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── strava/         # Strava API integration
│   │   ├── analytics/      # Analytics tracking
│   │   ├── app.module.ts   # Main app module
│   │   └── main.ts         # Application entry point
│   └── package.json
├── frontend/               # Next.js Frontend
│   ├── app/                # Next.js 14 app router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable components
│   ├── lib/                # Utilities & API client
│   └── package.json
├── ml-service/             # Python FastAPI ML Service
│   ├── app/
│   │   └── main.py         # FastAPI application
│   └── requirements.txt    # Python dependencies
├── docker-compose.yml      # Development environment
├── PROJECT_OVERVIEW.md     # Detailed project documentation
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Docker & Docker Compose (recommended)
- PostgreSQL (or use Docker)

### Option 1: Docker Development (Recommended)
```bash
# Clone and setup
git clone <repository-url>
cd AeroPacer

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# ML Service: http://localhost:8000
```

### Option 2: Local Development

Start each service in separate terminals after configuring environment variables.

## 🔧 Technology Stack

### Backend
- **NestJS** with TypeScript
- **PostgreSQL** database
- **Redis** for caching
- **JWT** authentication
- **Strava API** integration

### Frontend  
- **Next.js 14** with React
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **PWA** capabilities

### AI/ML Service
- **FastAPI** with Python
- **scikit-learn** for ML algorithms
- **PyTorch** for neural networks
- **NumPy/Pandas** for data processing

### Analytics & Monitoring
- **Mixpanel** for user behavior tracking
- Custom event tracking for running metrics

## 🏃‍♂️ Core Features

- **Authentication**: Email/password with JWT; profile read/update
- **Strava Integration**: OAuth connect, disconnect, connection status, and activities sync (auto-sync on connect and manual/extended sync)
- **AI Coaching**: Recommendations, training plan generation, and next-workout suggestions via ML service
- **Performance Analytics**: Performance prediction endpoint; training load and fatigue analysis
- **Race Planning**: Race strategy endpoint
- **Analytics Tracking**: Server-side Mixpanel integration and custom analytics endpoints

## 📊 Analytics Implementation

As required by the final project guidelines, AeroPacer includes comprehensive analytics:

- **User Behavior Tracking**: Backend Mixpanel integration for detailed interaction analysis (token-based server-side tracking)
- **Custom Events**: Endpoints for page views, workouts completed, goals achieved, and Strava syncs
- **Real-time Monitoring**: Frontend dashboard surfaces ML-powered analytics and recommendations

> **Note**: Analytics are configured to work without ad blockers by using first-party tracking and custom implementations.

## 🔐 Environment Variables

Configure the `.env` files with your credentials:

- Backend (`backend/.env`): `DB_*`, `JWT_SECRET`, `MIXPANEL_TOKEN`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, optional `FRONTEND_URL`
- Frontend (`frontend/.env.local`): optional `BACKEND_URL` (defaults to `http://localhost:3001` via proxy), `NEXT_PUBLIC_*` as needed
- ML service: no secrets required by default

Note: CORS is enabled for `http://localhost:3000` and `http://127.0.0.1:3000` by default.

## 📖 Documentation

- `PROJECT_OVERVIEW.md`: Detailed project specifications
- `START_SERVICES.md`: Commands and URLs to run all services locally
- `SETUP_GUIDE.md`: Environment and key setup steps (Strava, Mixpanel)

## 🔌 Key API Endpoints (Backend)

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/profile`
- Users: `GET /api/users/profile`, `PUT /api/users/profile`
- Strava: `GET /api/strava/connect`, `GET /api/strava/callback`, `POST /api/strava/sync`, `POST /api/strava/sync/extended?months=12`, `POST /api/strava/disconnect`, `GET /api/strava/status`, `GET /api/strava/activities`
- Analytics: `POST /api/analytics/track`, `POST /api/analytics/page-view`, `GET /api/analytics/metrics/:userId`, `POST /api/analytics/workout/completed`, `POST /api/analytics/goal/achieved`, `POST /api/analytics/strava/sync`
- ML: `GET /api/ml/coaching/recommendations`, `POST /api/ml/performance/predict`, `GET /api/ml/fatigue/analyze`, `GET /api/ml/training/load`, `POST /api/ml/race/strategy`, `POST /api/ml/training/plan`, `POST /api/ml/workout/next`, `GET /api/ml/health`, `GET /api/ml/status`

## 🤝 Contributing

This is a final project implementation. Development follows:
1. Feature branch workflow
2. TypeScript strict mode
3. Comprehensive testing
4. Analytics-first development

## 🎯 Project Goals

✅ **Primary Requirements Met:**
- AI/ML integration for personalized coaching
- Real user data via Strava API
- Comprehensive analytics implementation
- Modern, scalable architecture
- Performance tracking and visualization

This project demonstrates the complete development lifecycle from idea to implementation, showcasing modern web development practices, AI integration, and comprehensive user analytics.

---

**AeroPacer** - Transforming running data into actionable insights with AI! 🚀