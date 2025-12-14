# =============================================================================
# AvaAgent Production Deployment Script (Windows)
# =============================================================================
# Usage: .\scripts\deploy-production.ps1 [-Build] [-Migrate] [-SSL]
# =============================================================================

param(
    [switch]$Build,
    [switch]$Migrate,
    [switch]$SSL,
    [switch]$Logs,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Status,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$ComposeFile = "docker-compose.production.yml"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Help {
    Write-Host @"
AvaAgent Production Deployment Script (Windows)

Usage: .\scripts\deploy-production.ps1 [options]

Options:
  -Build      Rebuild Docker images before deploying
  -Migrate    Run database migrations after deployment
  -SSL        Setup SSL certificates
  -Logs       Follow logs after deployment
  -Stop       Stop all services
  -Restart    Restart all services
  -Status     Show service status
  -Help       Show this help

Examples:
  .\scripts\deploy-production.ps1 -Build -Migrate
  .\scripts\deploy-production.ps1 -Status
  .\scripts\deploy-production.ps1 -Stop
"@
    exit 0
}

function Test-Requirements {
    Write-Info "Checking requirements..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed"
        exit 1
    }
    
    if (-not (Test-Path $ComposeFile)) {
        Write-Error "Compose file not found: $ComposeFile"
        exit 1
    }
    
    Write-Info "Requirements check passed"
}

function Test-EnvFiles {
    Write-Info "Checking environment files..."
    
    if (-not (Test-Path "backend/.env")) {
        Write-Error "Backend .env file not found!"
        Write-Warn "Copy backend/.env.production to backend/.env and configure it"
        exit 1
    }
    
    if (-not (Test-Path "frontend/.env")) {
        Write-Error "Frontend .env file not found!"
        Write-Warn "Copy frontend/.env.production to frontend/.env and configure it"
        exit 1
    }
    
    # Check for placeholder values
    $backendEnv = Get-Content "backend/.env" -Raw
    if ($backendEnv -match "CHANGE_ME") {
        Write-Error "Backend .env contains CHANGE_ME placeholders!"
        Write-Warn "Please configure all production values before deploying"
        exit 1
    }
    
    # Verify DEMO_MODE is disabled
    if ($backendEnv -match "DEMO_MODE=true") {
        Write-Error "DEMO_MODE is enabled in backend/.env!"
        Write-Warn "Set DEMO_MODE=false for production deployment"
        exit 1
    }
    
    Write-Info "Environment files validated"
}

function Build-Images {
    Write-Info "Building Docker images..."
    docker-compose -f $ComposeFile build --no-cache
    Write-Info "Images built successfully"
}

function Start-Deployment {
    Write-Info "Deploying AvaAgent to production..."
    
    if ($Build) {
        Build-Images
    }
    
    docker-compose -f $ComposeFile up -d
    
    Write-Info "Waiting for services to start..."
    Start-Sleep -Seconds 10
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5
        Write-Info "Frontend is healthy"
    } catch {
        Write-Warn "Frontend health check failed"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 5
        Write-Info "Backend is healthy"
    } catch {
        Write-Warn "Backend health check failed"
    }
    
    Write-Info "Deployment complete!"
}

function Invoke-Migrations {
    Write-Info "Running database migrations..."
    docker-compose -f $ComposeFile exec -T backend alembic upgrade head
    Write-Info "Migrations complete"
}

function Show-Status {
    Write-Info "Service Status:"
    docker-compose -f $ComposeFile ps
}

function Show-Logs {
    Write-Info "Following logs (Ctrl+C to exit)..."
    docker-compose -f $ComposeFile logs -f
}

function Stop-Services {
    Write-Info "Stopping services..."
    docker-compose -f $ComposeFile down
    Write-Info "Services stopped"
}

function Restart-Services {
    Write-Info "Restarting services..."
    docker-compose -f $ComposeFile restart
    Write-Info "Services restarted"
}

# Main execution
Write-Host @"
==============================================
  AvaAgent Production Deployment
==============================================
"@

if ($Help) {
    Show-Help
}

Test-Requirements

if ($Stop) {
    Stop-Services
    exit 0
}

if ($Restart) {
    Restart-Services
    exit 0
}

if ($Status) {
    Show-Status
    exit 0
}

Test-EnvFiles
Start-Deployment

if ($Migrate) {
    Invoke-Migrations
}

Show-Status

if ($Logs) {
    Show-Logs
}

Write-Host @"

[INFO] AvaAgent is now running in production!

  Frontend: https://avaagent.app
  API:      https://api.avaagent.app

"@ -ForegroundColor Green
