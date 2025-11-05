@echo off
echo ===================================
echo SRHR Geospatial Dashboard Setup
echo ===================================
echo.

echo [1/4] Setting up Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo Error: Failed to create virtual environment
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    exit /b 1
)

echo [4/4] Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    exit /b 1
)

echo.
echo ===================================
echo Setup completed successfully!
echo ===================================
echo.
echo To run the application:
echo 1. Start the backend:  run-backend.bat
echo 2. Start the frontend: run-frontend.bat
echo.
pause

