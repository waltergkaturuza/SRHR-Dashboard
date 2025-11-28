@echo off
echo ========================================
echo   Initialize Facilities Tables
echo ========================================
echo.
echo Calling API to create tables...
echo.

curl -X POST https://srhr-dashboard.onrender.com/api/admin/init-tables

echo.
echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo If you saw "successfully" above, tables are created!
echo Now re-upload your clinics and they will show on the map.
echo.
pause

