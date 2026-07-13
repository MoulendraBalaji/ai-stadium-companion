@echo off
title StadiumOS AI - Dev Launcher
color 0B

echo.
echo  ============================================
echo   StadiumOS AI - Development Launcher
echo  ============================================
echo.
echo  [1] Start Frontend + Backend (Recommended)
echo  [2] Start Frontend Only
echo  [3] Start Backend Only
echo  [4] Run All Tests
echo  [5] Exit
echo.
set /p choice="  Select option: "

if "%choice%"=="1" goto both
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto tests
if "%choice%"=="5" goto end

:both
echo.
echo  Starting Backend on http://localhost:8000 ...
start "StadiumOS Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
echo  Starting Frontend on http://localhost:5234 ...
start "StadiumOS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo.
echo  Both services starting...
echo  Frontend: http://localhost:5234
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo.
pause
goto end

:frontend
echo.
echo  Starting Frontend on http://localhost:5234 ...
start "StadiumOS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo  Frontend running at http://localhost:5234
pause
goto end

:backend
echo.
echo  Starting Backend on http://localhost:8000 ...
start "StadiumOS Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo  Backend running at http://localhost:8000
echo  API Docs: http://localhost:8000/docs
pause
goto end

:tests
echo.
echo  Running Backend Tests...
echo  -----------------------
cd /d %~dp0backend && python -m pytest --cov=app -v
echo.
echo  Running Frontend Tests...
echo  ------------------------
cd /d %~dp0frontend && npm test
echo.
echo  All tests complete.
pause
goto end

:end
