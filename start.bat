@echo off
REM ==============================================================================
REM KrishiMitra — Local Quick-Start Script (Windows)
REM ==============================================================================

echo.
echo =================================================================
echo   🌱 Starting KrishiMitra Local Development Server
echo   Direct Farm-to-Buyer Marketplace (SIH26033)
echo =================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system.
    echo Please download and install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

node -v
npm -v
echo.

REM Check if .env exists, if not copy from .env.example
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [OK] .env file created.
)

REM Check if node_modules exists, otherwise install dependencies
if not exist node_modules (
    echo [INFO] Installing project dependencies (npm install)...
    call npm install
    echo [OK] Dependencies installed.
)

echo.
echo [INFO] Launching KrishiMitra server on http://localhost:3000...
echo Press Ctrl+C in this window to stop the server.
echo.

REM Start dev server
call npm run dev
pause
