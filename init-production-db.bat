@echo off
echo ========================================
echo   Initialize Production Database
echo ========================================
echo.

SET DB_URL=postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard

echo Testing database connection...
psql "%DB_URL%" -c "SELECT version();"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Cannot connect to database!
    echo Please check:
    echo 1. PostgreSQL client (psql) is installed
    echo 2. Database URL is correct
    echo 3. Internet connection is active
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Step 1: Enable PostGIS Extension
echo ========================================
psql "%DB_URL%" -c "CREATE EXTENSION IF NOT EXISTS postgis;"

echo.
echo ========================================
echo   Step 2: Check Existing Tables
echo ========================================
psql "%DB_URL%" -c "\dt"

echo.
echo ========================================
echo   Step 3: Create Database Schema
echo ========================================
psql "%DB_URL%" -f database/schema.sql

echo.
echo ========================================
echo   Step 4: Seed Sample Data
echo ========================================
psql "%DB_URL%" -f database/seed.sql

echo.
echo ========================================
echo   Step 5: Verify Data
echo ========================================
echo.
echo Checking platforms by year:
psql "%DB_URL%" -c "SELECT year, COUNT(*) as platforms, SUM(youth_count) as total_youth FROM health_platforms GROUP BY year ORDER BY year;"

echo.
echo ========================================
echo   Database Initialization Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to Render dashboard
echo 2. Restart your backend service
echo 3. Test: https://srhr-dashboard.onrender.com/api/health
echo.

pause

