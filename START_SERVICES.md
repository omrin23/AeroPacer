# AeroPacer - Service Startup Guide

## 🚀 Quick Start Commands

### Start Everything (Recommended Order)

1. **Start Docker Containers** (Database)
   ```bash
   docker-compose up postgres redis -d
   ```

2. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Start ML Service** (Terminal 3)
   ```bash
   cd ml-service
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --port 8000
   ```

## 📍 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/health
- **ML Service**: http://localhost:8000/health

## 🛑 Stop Services

### Stop Application Services
- Press `Ctrl+C` in each terminal running the services

### Stop Docker Containers
```bash
docker-compose down
```

## 🔄 Restart Everything
```bash
# Stop docker containers
docker-compose down

# Start docker containers
docker-compose up postgres redis -d

# Start all services again (in separate terminals)
cd backend && npm run start:dev &
cd frontend && npm run dev &
cd ml-service && source venv/bin/activate && python -m uvicorn app.main:app --reload --port 8000 &
```

## ✅ Verify Everything is Working

Test each service:
```bash
# Test backend
curl http://localhost:3001/api/health

# Test ML service  
curl http://localhost:8000/health

# Test frontend (open in browser)
open http://localhost:3000
```

## 🔧 Troubleshooting

**Backend won't start?**
- Check if PostgreSQL container is running: `docker-compose ps`
- Verify `.env` file exists in backend folder

**Frontend won't start?**
- Check if backend is running first
- Verify `.env.local` file exists in frontend folder

**ML Service won't start?**
- Activate virtual environment: `source ml-service/venv/bin/activate`
- Check if Python dependencies are installed: `pip list`

**Docker won't start?**
- Make sure Docker Desktop is running on your Mac
- Check containers status: `docker-compose ps`