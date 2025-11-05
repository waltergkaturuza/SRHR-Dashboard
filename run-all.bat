@echo off
echo ===================================
echo SRHR Geospatial Dashboard
echo ===================================
echo.
echo Starting Backend and Frontend...
echo.

start "SRHR Backend" cmd /k "venv\Scripts\activate.bat && python app.py"
timeout /t 3 /nobreak > nul
start "SRHR Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.

