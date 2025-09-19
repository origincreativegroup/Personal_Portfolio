# Portfolio Forge - PowerShell Startup Script
# This script starts both the frontend and backend services on Windows

param(
    [switch]$NoBrowser,
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red    = "Red"
    Green  = "Green"
    Yellow = "Yellow"
    Blue   = "Blue"
    Cyan   = "Cyan"
    Magenta = "Magenta"
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Write-Header {
    param([string]$Message)
    Write-Host $Message -ForegroundColor $Colors.Magenta
}

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -InformationLevel Quiet
        return $connection
    }
    catch {
        return $false
    }
}

# Function to kill processes on specific ports
function Stop-PortProcesses {
    param([int]$Port)
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($processes) {
            Write-Warning "Stopping existing processes on port $Port"
            $processes | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 1
        }
    }
    catch {
        # Ignore errors when no processes found
    }
}

# Function to check if Node.js is installed
function Test-Node {
    try {
        $nodeVersion = node --version
        Write-Status "Node.js version: $nodeVersion"
        return $true
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js first."
        return $false
    }
}

# Function to check if npm is installed
function Test-Npm {
    try {
        $npmVersion = npm --version
        Write-Status "npm version: $npmVersion"
        return $true
    }
    catch {
        Write-Error "npm is not installed. Please install npm first."
        return $false
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Status "Checking and installing dependencies..."

    # Frontend dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Status "Installing frontend dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install frontend dependencies"
            exit 1
        }
    }

    # Backend dependencies
    if (-not (Test-Path "server/node_modules")) {
        Write-Status "Installing backend dependencies..."
        Set-Location server
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install backend dependencies"
            Set-Location ..
            exit 1
        }
        Set-Location ..
    }

    Write-Success "Dependencies are ready"
}

# Function to build the backend
function Build-Backend {
    Write-Status "Building backend..."
    Set-Location server

    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build backend"
        Set-Location ..
        exit 1
    }

    Write-Success "Backend built successfully"
    Set-Location ..
}

# Function to start the backend
function Start-Backend {
    Write-Status "Starting backend server..."

    # Kill any existing process on port 3001
    Stop-PortProcesses -Port 3001

    Set-Location server

    # Start backend in the background
    if (Test-Path "dist/app.js") {
        $backendJob = Start-Job -ScriptBlock { Set-Location $using:PWD; npm start }
        Write-Success "Backend server starting on port 3001 (Job ID: $($backendJob.Id))"
    }
    else {
        Write-Warning "Backend not built, starting in development mode..."
        $backendJob = Start-Job -ScriptBlock { Set-Location $using:PWD; npm run dev }
        Write-Success "Backend server starting in dev mode on port 3001 (Job ID: $($backendJob.Id))"
    }

    Set-Location ..

    # Wait a moment for the server to start
    Start-Sleep -Seconds 3

    # Check if backend is running
    if (Test-Port -Port 3001) {
        Write-Success "Backend server is running on http://localhost:3001"
    }
    else {
        Write-Warning "Backend server may not have started properly"
    }

    return $backendJob
}

# Function to start the frontend
function Start-Frontend {
    Write-Status "Starting frontend development server..."

    # Kill any existing process on port 5173
    Stop-PortProcesses -Port 5173

    # Start frontend in the background
    $frontendJob = Start-Job -ScriptBlock { Set-Location $using:PWD; npm run dev }
    Write-Success "Frontend server starting on port 5173 (Job ID: $($frontendJob.Id))"

    # Wait a moment for the server to start
    Start-Sleep -Seconds 3

    # Check if frontend is running
    if (Test-Port -Port 5173) {
        Write-Success "Frontend server is running on http://localhost:5173"
    }
    else {
        Write-Warning "Frontend server may not have started properly"
    }

    return $frontendJob
}

# Function to open the application in browser
function Open-Browser {
    Write-Status "Opening application in browser..."
    try {
        Start-Process "http://localhost:5173"
    }
    catch {
        Write-Warning "Could not automatically open browser. Please visit http://localhost:5173"
    }
}

# Function to display running services
function Show-Status {
    param($FrontendJob, $BackendJob)

    Write-Host ""
    Write-Header "🚀 Portfolio Forge is running!"
    Write-Host ""
    Write-Status "Frontend: http://localhost:5173"
    Write-Status "Backend:  http://localhost:3001"
    Write-Host ""
    Write-Status "Frontend Job ID: $($FrontendJob.Id)"
    Write-Status "Backend Job ID:  $($BackendJob.Id)"
    Write-Host ""
    Write-Status "Press Ctrl+C to stop all services"
}

# Function to cleanup on exit
function Stop-Services {
    param($FrontendJob, $BackendJob)

    Write-Host ""
    Write-Warning "Shutting down services..."

    if ($FrontendJob) {
        Stop-Job -Job $FrontendJob -ErrorAction SilentlyContinue
        Remove-Job -Job $FrontendJob -ErrorAction SilentlyContinue
        Write-Status "Frontend server stopped"
    }

    if ($BackendJob) {
        Stop-Job -Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job -Job $BackendJob -ErrorAction SilentlyContinue
        Write-Status "Backend server stopped"
    }

    # Kill any remaining processes on our ports
    Stop-PortProcesses -Port 5173
    Stop-PortProcesses -Port 3001

    Write-Success "All services stopped. Goodbye!"
}

# Show help
if ($Help) {
    Write-Host "Portfolio Forge Startup Script"
    Write-Host ""
    Write-Host "Usage: .\start.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -NoBrowser    Don't automatically open browser"
    Write-Host "  -Help         Show this help message"
    Write-Host ""
    Write-Host "Services:"
    Write-Host "  Frontend: http://localhost:5173"
    Write-Host "  Backend:  http://localhost:3001"
    exit 0
}

# Main execution
try {
    Write-Header "🎨 Portfolio Forge Startup Script"
    Write-Header "=================================="
    Write-Host ""

    # Check prerequisites
    if (-not (Test-Node)) { exit 1 }
    if (-not (Test-Npm)) { exit 1 }
    Write-Host ""

    # Install dependencies
    Install-Dependencies
    Write-Host ""

    # Build backend if needed
    if (-not (Test-Path "server/dist/app.js")) {
        Build-Backend
        Write-Host ""
    }

    # Start services
    $backendJob = Start-Backend
    $frontendJob = Start-Frontend

    # Open browser
    if (-not $NoBrowser) {
        Open-Browser
    }

    # Show status
    Show-Status -FrontendJob $frontendJob -BackendJob $backendJob

    # Keep script running and monitor jobs
    try {
        while ($true) {
            Start-Sleep -Seconds 1

            # Check if jobs are still running
            if ($frontendJob.State -eq 'Failed' -or $backendJob.State -eq 'Failed') {
                Write-Warning "One or more services failed. Check the job output for details."
                break
            }
        }
    }
    finally {
        Stop-Services -FrontendJob $frontendJob -BackendJob $backendJob
    }
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Stop-Services -FrontendJob $frontendJob -BackendJob $backendJob
    exit 1
}