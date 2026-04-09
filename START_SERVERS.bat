@echo off
echo ===================================
echo   UniTrack AI - Start Local Servers
echo ===================================

echo [1] Starting Python Backend (FastAPI)...
start cmd /k "cd /d "%~dp0backend" && ..\.venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo [2] Starting Frontend (Vite/React)...
start cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend should be available at http://localhost:5173
echo Backend API should be available at http://127.0.0.1:8000
echo ===================================
pause
