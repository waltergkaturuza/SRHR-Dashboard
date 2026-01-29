@echo off
REM Script to add youth representative information to districts
REM Make sure the backend is running before running this script

echo ========================================
echo Youth Representative Information Setup
echo ========================================
echo.
echo This script will add youth representative information to your districts.
echo Make sure your backend API is running on http://localhost:5000
echo.
pause

python add-youth-rep-info.py

echo.
pause
