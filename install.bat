@echo off
setlocal
title ALEG BOOTLOADER - NEW PC READY

echo ===================================================
echo   ALEG APP - UNIVERSAL BOOTLOADER v2.0
echo   Operacion New PC Ready
echo ===================================================
echo.

:: 1. BYPASS POWERSHELL POLICY
echo [1/5] 🛡️  Configuring Security Policy...
powershell -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠️  Could not set PowerShell policy. You might need Admin rights.
    echo    Continuing anyway...
) else (
    echo    ✅  PowerShell Policy Unlocked.
)
echo.

:: 2. DEPENDENCY CHECK (RETRY LOOP)
echo [2/5] 🔍 Checking Dependencies...

:CHECK_NODE
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Node.js NOT FOUND.
    echo    Please install Node.js (LTS) manually.
    timeout /t 5
    goto CHECK_NODE
)
echo    ✅ Node.js Detected.

:CHECK_DOCKER
docker -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Docker NOT FOUND or NOT RUNNING.
    echo    Please start Docker Desktop.
    timeout /t 5
    goto CHECK_DOCKER
)
echo    ✅ Docker Detected.

:CHECK_GIT
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo    ❌ Git NOT FOUND.
    echo    Please install Git.
    timeout /t 5
    goto CHECK_GIT
)
echo    ✅ Git Detected.
echo.

:: 3. NPM INSTALL (ROOT & MODULES)
echo [3/5] 📦 Installing Dependencies...
if exist "node_modules" (
    echo    ✅ Root dependencies already installed. Skipping.
) else (
    echo    📥 Installing ROOT dependencies...
    call npm install
)

if exist "backend\node_modules" (
    echo    ✅ Backend dependencies already installed. Skipping.
) else (
    echo    📥 Installing BACKEND dependencies...
    cd backend
    call npm install
    cd ..
)

if exist "frontend\node_modules" (
    echo    ✅ Frontend dependencies already installed. Skipping.
) else (
    echo    📥 Installing FRONTEND dependencies...
    cd frontend
    call npm install
    cd ..
)
echo.

:: 4. BOOTSTRAP (ENV & CONFIG)
echo [4/5] ⚙️  Bootstrapping Environment...
call npm run bootstrap
echo.

:: 5. LAUNCH GUIDANCE
echo [5/5] 🚀 Ready to Launch!
echo.
echo ===================================================
echo   SETUP COMPLETE!
echo ===================================================
echo.
echo To start the system, run:
echo    npm run dev        (Smart Start with DB Checks)
echo.
echo To populate data (First Run):
echo    npm run seed       (Create Tenants & Data)
echo.
pause
