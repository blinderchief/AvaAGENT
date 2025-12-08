@echo off
REM AvaAgent Windows Deployment Script
REM Deploys the full stack using Docker Compose

setlocal enabledelayedexpansion

echo ============================================================
echo           AvaAgent Production Deployment Script
echo ============================================================
echo.

REM Check for Docker
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH
    exit /b 1
)

REM Check for Docker Compose
docker compose version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Compose is not available
    exit /b 1
)

REM Check for .env file
if not exist .env (
    echo [ERROR] .env file not found. Copy .env.example and configure it.
    exit /b 1
)

echo [INFO] Prerequisites check passed
echo.

REM Parse command line argument
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=deploy

if "%COMMAND%"=="deploy" goto :deploy
if "%COMMAND%"=="build" goto :build
if "%COMMAND%"=="up" goto :up
if "%COMMAND%"=="down" goto :down
if "%COMMAND%"=="restart" goto :restart
if "%COMMAND%"=="logs" goto :logs
if "%COMMAND%"=="health" goto :health
if "%COMMAND%"=="dev" goto :dev

echo Usage: deploy.bat [deploy^|build^|up^|down^|restart^|logs^|health^|dev]
exit /b 1

:deploy
echo [INFO] Starting full deployment...
call :build
call :up
call :health
goto :end

:build
echo [INFO] Building Docker images...
docker compose build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [SUCCESS] Images built successfully
exit /b 0

:up
echo [INFO] Starting services...
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to start services
    exit /b 1
)
echo [SUCCESS] Services started
echo.
echo Waiting for services to initialize...
timeout /t 10 /nobreak >nul
exit /b 0

:down
echo [INFO] Stopping services...
docker compose down
echo [SUCCESS] Services stopped
exit /b 0

:restart
echo [INFO] Restarting services...
docker compose restart
echo [SUCCESS] Services restarted
exit /b 0

:logs
echo [INFO] Showing logs...
docker compose logs --tail=100 -f
exit /b 0

:health
echo [INFO] Checking service health...
echo.
curl -s -o nul -w "Backend: HTTP %%{http_code}\n" http://localhost:8000/health
curl -s -o nul -w "Frontend: HTTP %%{http_code}\n" http://localhost:3000
echo.
exit /b 0

:dev
echo [INFO] Starting development environment...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
echo.
echo Development environment started!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
exit /b 0

:end
echo.
echo ============================================================
echo              Deployment Complete!
echo ============================================================
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ============================================================
