# Environment Setup Guide

## 🚀 Quick Setup Steps

### 1. Configure Environment Files
Update the provided `.env` files with your actual API credentials.

### 2. Get Your API Keys

#### 🏃‍♂️ Strava API Setup
1. Go to https://developers.strava.com/
2. Click "Create App" 
3. Fill in:
   - **Application Name**: "AeroPacer Development"
   - **Category**: "Data Importer"
   - **Club**: Leave blank
   - **Website**: `http://localhost:3000`
   - **Authorization Callback Domain**: `localhost`
4. Copy your **Client ID** and **Client Secret**
5. Update in both `backend/.env` and `frontend/.env.local`

#### 📊 Mixpanel Setup  
1. Go to https://mixpanel.com/register/
2. Create a new project called "AeroPacer"
3. Go to Settings → Project Settings
4. Copy your **Project Token**
5. Update `MIXPANEL_TOKEN` in both `.env` files

#### 📈 Google Analytics Setup
1. Go to https://analytics.google.com/
2. Create a new GA4 property
3. Set up a web data stream for `localhost:3000`
4. Copy your **Measurement ID** (starts with G-)
5. Update `GOOGLE_ANALYTICS_ID` in both `.env` files

### 3. Start the Services

#### Option A: Docker + Local (Recommended)
Start PostgreSQL and Redis with Docker, then run services locally for easier development.

#### Option B: Full Docker
Start everything with Docker using docker-compose.

### 4. Verify Setup
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/health  
- **ML Service**: http://localhost:8000/health

## 🔑 What Each Service Needs

| Service | Strava | Mixpanel | Google Analytics |
|---------|--------|----------|------------------|
| Backend | ✅ Client ID + Secret | ✅ Token | ✅ Measurement ID |
| Frontend | ✅ Client ID only | ✅ Token | ✅ Measurement ID |
| ML Service | ❌ | ❌ | ❌ |

## 🐳 Docker vs Local PostgreSQL

**✅ Docker PostgreSQL (Recommended):**
- No local installation needed
- Consistent across machines  
- Easy cleanup
- Already configured in `docker-compose.yml`

**❌ Local PostgreSQL:**
- Need to install PostgreSQL
- Configure users/databases manually
- Version compatibility issues

**Bottom line:** Use Docker for PostgreSQL, it's much easier! 🚀

## 🔧 Troubleshooting

**Can't connect to database?**
Make sure PostgreSQL container is running with Docker.

**Frontend can't reach backend?**
- Check `NEXT_PUBLIC_BACKEND_URL=http://localhost:3001` in `frontend/.env.local`

**Strava OAuth not working?**
- Verify callback URL: `http://localhost:3001/api/strava/callback`
- Check both Client ID and Secret are correct