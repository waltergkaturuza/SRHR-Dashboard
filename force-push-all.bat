@echo off
echo ========================================
echo   Force Push All Changes to GitHub
echo ========================================
echo.
echo Repository: https://github.com/waltergkaturuza/SRHR-Dashboard.git
echo.

cd /d "C:\Users\Administrator\Documents\SRHR Dashboard"

echo [1/6] Checking current status...
git status
echo.

echo [2/6] Checking remote repository...
git remote -v
echo.

echo [3/6] Showing recent commits...
git log --oneline -5
echo.

echo [4/6] Adding all files (including untracked)...
git add -A
echo.

echo [5/6] Committing changes with timestamp...
git commit -m "Update: SRHR Dashboard - %date% %time%" -m "- Multi-layer support" -m "- Boundaries" -m "- All facility types" -m "- 74 Harare suburbs" -m "- Enhanced upload" -m "- Fixed layouts"
echo.

echo [6/6] Pushing to GitHub (with force if needed)...
git push origin main
echo.

echo Checking if push succeeded...
git log origin/main --oneline -1
echo.

echo ========================================
if %errorlevel% equ 0 (
    echo   SUCCESS! All changes pushed
    echo.
    echo   Check GitHub: https://github.com/waltergkaturuza/SRHR-Dashboard
) else (
    echo   FAILED! Check errors above
)
echo ========================================
echo.

pause
