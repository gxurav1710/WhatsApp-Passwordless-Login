# WhatsApp Auth - Docker Startup & Orchestration Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp Auth - Docker Startup Assistant" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Ensure .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# 2. Check if Docker CLI is in Path, if not add it
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
    $cliPaths = @(
        "$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin",
        "$env:ProgramFiles\Docker\Docker\resources\bin",
        "C:\Program Files\Docker\Docker\resources\bin"
    )
    foreach ($p in $cliPaths) {
        if (Test-Path $p) {
            $env:Path += ";$p"
            break
        }
    }
}

# 3. Check if Docker daemon is running
function Test-DockerRunning {
    $null = docker info 2>&1
    return ($LASTEXITCODE -eq 0)
}

$isRunning = Test-DockerRunning

if (-not $isRunning) {
    Write-Host "[INFO] Docker daemon is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow

    $dockerDesktopPaths = @(
        "$env:LOCALAPPDATA\Programs\DockerDesktop\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Programs\Docker\Docker\Docker Desktop.exe",
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Docker Desktop.lnk"
    )

    $started = $false
    foreach ($path in $dockerDesktopPaths) {
        if (Test-Path $path) {
            Write-Host "[INFO] Launching Docker Desktop from: $path" -ForegroundColor Cyan
            Start-Process $path
            $started = $true
            break
        }
    }

    if (-not $started) {
        Write-Host "[WARN] Could not automatically locate Docker Desktop executable." -ForegroundColor Yellow
        Write-Host "Please start Docker Desktop manually from your Start Menu, then press any key to continue." -ForegroundColor White
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }

    # Wait for Docker daemon to become responsive
    Write-Host "[INFO] Waiting for Docker daemon to initialize (this may take 20-30 seconds)..." -ForegroundColor Yellow
    $maxWaitSec = 120
    $waited = 0

    while (-not (Test-DockerRunning) -and ($waited -lt $maxWaitSec)) {
        Start-Sleep -Seconds 4
        $waited += 4
        Write-Host "  Waiting for Docker engine... ($waited/$maxWaitSec s)" -ForegroundColor Gray
    }

    if (-not (Test-DockerRunning)) {
        Write-Host "[ERROR] Docker engine did not start in time." -ForegroundColor Red
        Write-Host "Please ensure Docker Desktop is open and showing 'Engine running', then re-run this script." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "[OK] Docker daemon is running!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Launching WhatsApp Auth containers with Docker Compose..." -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

# 4. Run docker compose up
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "------------------------------------------------------------" -ForegroundColor Gray
    Write-Host "[SUCCESS] All WhatsApp Auth services are up and running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  -> Developer Dashboard : http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  -> Auth Core REST API  : http://localhost:4000" -ForegroundColor Cyan
    Write-Host "  -> Swagger UI Docs     : http://localhost:4000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Opening Developer Dashboard in default browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
} else {
    Write-Host "[ERROR] docker compose up failed. Please check the logs above." -ForegroundColor Red
}
