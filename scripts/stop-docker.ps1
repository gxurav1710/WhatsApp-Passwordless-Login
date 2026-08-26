# WhatsApp Auth - Complete Shutdown & Docker Desktop Termination Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp Auth - Complete Shutdown & Docker Kill" -ForegroundColor Red
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Stop Docker Compose containers gracefully if docker CLI is available
Write-Host "[1/4] Stopping all project Docker containers..." -ForegroundColor Yellow
try {
    docker compose down --remove-orphans -t 5 2>$null
} catch {
    # Ignore if daemon is already unresponsive
}

# 2. Kill all Docker Desktop and Docker background processes on Windows
Write-Host "[2/4] Terminating Docker Desktop application & background daemons..." -ForegroundColor Yellow
$dockerProcessNames = @(
    "Docker Desktop",
    "DockerDesktop",
    "com.docker.backend",
    "com.docker.service",
    "com.docker.proxy",
    "com.docker.build",
    "com.docker.diagnose",
    "com.docker.extensions",
    "dockerd",
    "docker",
    "vpnkit"
)

foreach ($procName in $dockerProcessNames) {
    $processes = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($processes) {
        foreach ($p in $processes) {
            Write-Host "  -> Killing Docker process: $($p.ProcessName) (PID: $($p.Id))" -ForegroundColor Gray
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    }
}

# 3. Kill any Chromium / Puppeteer orphan processes launched by WhatsApp Web
Write-Host "[3/4] Terminating any headless Chromium / Puppeteer processes..." -ForegroundColor Yellow
$chromiumProcs = Get-Process -Name "chrome", "chromium" -ErrorAction SilentlyContinue
foreach ($p in $chromiumProcs) {
    try {
        # Only kill if related to headless / puppeteer or inside scratch path
        if ($p.CommandLine -like "*puppeteer*" -or $p.CommandLine -like "*wwebjs*" -or $p.CommandLine -like "*--headless*") {
            Write-Host "  -> Killing WhatsApp headless browser process (PID: $($p.Id))" -ForegroundColor Gray
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # CommandLine inspection may fail without elevated permissions, skip non-target
    }
}

# 4. Clean up any lingering background servers on project ports (3000, 4000, 4001, 5000, 5432)
Write-Host "[4/4] Cleaning up all ports (3000, 4000, 4001, 5000, 5432)..." -ForegroundColor Yellow
$ports = @(3000, 4000, 4001, 5000, 5432)

foreach ($port in $ports) {
    try {
        $netstat = netstat -ano | Select-String ":$port\s"
        foreach ($line in $netstat) {
            $parts = $line.ToString().Trim() -split '\s+'
            $pidToKill = $parts[-1]
            if ($pidToKill -and ($pidToKill -match '^\d+$') -and ($pidToKill -ne "0") -and ($pidToKill -ne $PID)) {
                $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  -> Terminating process on port $port : $($proc.ProcessName) (PID: $pidToKill)" -ForegroundColor Gray
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # Ignore port check errors
    }
}

Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host "[SUCCESS] Complete shutdown finished!" -ForegroundColor Green
Write-Host "All containers, Docker Desktop, background daemons, and dev servers have been stopped." -ForegroundColor White
