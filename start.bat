@echo off
echo ====================================================
echo   Starting DeepTools Services...
echo ====================================================

:: 1. Start database container
echo [1/3] Starting PostgreSQL database...
docker compose up -d postgres

:: Wait 3 seconds for DB to warm up
timeout /t 3 /nobreak >null

:: 2. Start Backend API in a new window
echo [2/3] Starting Express Backend API (Port 4000)...
start "DeepTools Backend API" cmd /k "cd backend && npm run start:dev"

:: Wait 2 seconds
timeout /t 2 /nobreak >null

:: 3. Start Frontend in a new window
echo [3/3] Starting Next.js Web Frontend (Port 3000)...
start "DeepTools Web Frontend" cmd /k "cd frontend && npm run dev"

echo ====================================================
echo   All services have been launched!
echo   - Web Frontend:  http://localhost:3000
echo   - Backend API:   http://localhost:4000/api/v1
echo   - Swagger Docs:  http://localhost:4000/api/docs
echo ====================================================
pause
