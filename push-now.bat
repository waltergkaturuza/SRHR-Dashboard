@echo off
cd /d "C:\Users\Administrator\Documents\SRHR Dashboard"

echo Adding all files...
git add .

echo.
echo Committing...
git commit -m "Final push: All features complete - %date% %time%"

echo.
echo Pushing to GitHub...
git push origin main --verbose

echo.
echo Done! Check https://github.com/waltergkaturuza/SRHR-Dashboard
pause








