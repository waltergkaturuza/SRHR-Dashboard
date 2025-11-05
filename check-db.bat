@echo off
echo ========================================
echo   Quick Database Check
echo ========================================
echo.

SET DB_URL=postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard

echo Testing connection...
psql "%DB_URL%" -c "SELECT 'Database connection OK!' as status;"

echo.
echo Checking tables...
psql "%DB_URL%" -c "\dt"

echo.
echo Checking data...
psql "%DB_URL%" -c "SELECT COUNT(*) FROM health_platforms;"

echo.
pause

