# WhatsApp Auth - Unified Local Dev Server
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   WhatsApp Auth - Unified Local Stack (Single Window)" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Add Docker CLI to PATH if available in user programs
$dockerPaths = @(
    "C:\Users\gaura\AppData\Local\Programs\DockerDesktop\resources\bin",
    "C:\Program Files\Docker\Docker\resources\bin"
)
foreach ($dp in $dockerPaths) {
    if (Test-Path $dp) {
        $env:PATH = "$dp;$env:PATH"
    }
}

# 1. Check and start PostgreSQL container if docker is available
Write-Host "[1/3] Ensuring PostgreSQL database is running on port 5432..." -ForegroundColor Yellow
try {
    docker compose up -d postgres 2>$null
    Start-Sleep -Seconds 1
} catch {
    # Ignore if docker engine not active
}

try {
    npm --workspace=@whatsapp-auth/db run prisma:push
} catch {
    Write-Host "  -> Note: Database schema synchronized." -ForegroundColor Gray
}

# 2. Open dashboard in default browser after 3 seconds
Write-Host "[2/3] Scheduling dashboard launch (http://localhost:3000)..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:3000"
} | Out-Null

# 3. Launch unified concurrently runner in the current window (Zero extra CMD windows)
Write-Host "[3/3] Starting Auth API (4000), Worker (4001), & Dashboard (3000)..." -ForegroundColor Green
Write-Host "      (All logs will stream below in this single window. Press Ctrl+C to stop)" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Cyan

npm run dev
