@echo off
echo Starting Fluid Dynamics Simulation...

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js to run this simulation.
    echo Visit https://nodejs.org/ to download and install Node.js.
    pause
    exit /b
)

REM Run the Node.js server
node server.js 