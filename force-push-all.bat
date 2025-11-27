@echo off
echo ========================================
echo   Force Push All Changes to GitHub
echo ========================================
echo.
echo Repository: https://github.com/waltergkaturuza/SRHR-Dashboard.git
echo.

cd /d "C:\Users\Administrator\Documents\SRHR Dashboard"

echo [1/5] Checking current status...
git status

echo.
echo [2/5] Checking remote repository...
git remote -v

echo.
echo [3/5] Adding all files...
git add -A

echo.
echo [4/5] Committing changes...
git commit -m "Complete SRHR Dashboard with all features: multi-layer, boundaries, admin panel, descriptions"

echo.
echo [5/5] Pushing to GitHub...
git push origin main

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo   SUCCESS! All changes pushed
) else (
    echo   FAILED! Check errors above
)
echo ========================================
echo.

pause

