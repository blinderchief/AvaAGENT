@echo off
echo.
echo ======================================================
echo    AvaAgent Demo Runner
echo    Avalanche Hackathon 2024
echo ======================================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

:: Install requirements if needed
echo [1/3] Installing demo requirements...
pip install requests rich web3 --quiet

:: Start backend if not running
echo [2/3] Checking backend status...
curl -s http://localhost:8000/api/v1/health >nul 2>&1
if errorlevel 1 (
    echo [INFO] Backend not running. Please start it in a separate terminal:
    echo        cd backend
    echo        .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
    echo.
    echo Press any key after starting the backend...
    pause >nul
)

:: Run the demo
echo [3/3] Starting demo...
echo.
cd /d "%~dp0"
python demo.py

pause
