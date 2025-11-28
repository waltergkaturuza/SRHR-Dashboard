@echo off
echo ========================================
echo   Check Uploaded Data in Database
echo ========================================
echo.

SET DB_URL=postgresql://srhr_user:brRQSDIPqb2l9uj4mZwcIl4pzew99wcJ@dpg-d45j2jfdiees738a84vg-a.oregon-postgres.render.com/srhr_dashboard

echo Checking health platforms table...
echo.
psql "%DB_URL%" -c "SELECT id, name, year, ST_X(location) as lon, ST_Y(location) as lat FROM health_platforms ORDER BY id DESC LIMIT 10;"

echo.
echo ========================================
echo.
echo Checking facilities table...
echo.
psql "%DB_URL%" -c "SELECT id, name, category, sub_type, year, ST_X(location) as lon, ST_Y(location) as lat FROM facilities ORDER BY id DESC LIMIT 10;"

echo.
echo ========================================
echo.
echo Checking if any data has Harare coordinates...
echo (Should be: Longitude: 31.0 to 31.1, Latitude: -17.78 to -17.87)
echo.
psql "%DB_URL%" -c "SELECT 'health' as source, name, ST_X(location) as lon, ST_Y(location) as lat FROM health_platforms WHERE ST_X(location) BETWEEN 31.0 AND 31.1 AND ST_Y(location) BETWEEN -17.87 AND -17.78 UNION ALL SELECT 'facility' as source, name, ST_X(location) as lon, ST_Y(location) as lat FROM facilities WHERE ST_X(location) BETWEEN 31.0 AND 31.1 AND ST_Y(location) BETWEEN -17.87 AND -17.78;"

echo.
pause

