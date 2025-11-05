@echo off
echo ========================================
echo   SRHR Dashboard - Push to GitHub
echo ========================================
echo.
echo Repository: https://github.com/waltergkaturuza/SRHR-Dashboard.git
echo.

REM Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [1/6] Initializing Git repository...
git init

echo.
echo [2/6] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/waltergkaturuza/SRHR-Dashboard.git

echo.
echo [3/6] Staging all files...
git add .

echo.
echo [4/6] Creating commit...
git commit -m "Initial commit: Complete SRHR Dashboard with PostgreSQL support"

echo.
echo [5/6] Setting main branch...
git branch -M main

echo.
echo [6/6] Pushing to GitHub...
echo.
echo You may be prompted for GitHub credentials.
echo Use your GitHub username and Personal Access Token (not password).
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo View your repository at:
    echo https://github.com/waltergkaturuza/SRHR-Dashboard
    echo.
) else (
    echo.
    echo ========================================
    echo   PUSH FAILED
    echo ========================================
    echo.
    echo Common solutions:
    echo 1. Check your internet connection
    echo 2. Verify GitHub credentials
    echo 3. Use Personal Access Token instead of password
    echo 4. Read GIT_SETUP_GUIDE.md for detailed help
    echo.
)

pause

