# WhatsApp Auth - Centralized Control Center
function Show-Menu {
    Clear-Host
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "         WhatsApp Auth - Central Control Center" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] Start Local (Fast, Live Reload, Node / Next.js)" -ForegroundColor White
    Write-Host "  [2] Start Docker (Containers & PostgreSQL)" -ForegroundColor White
    Write-Host "  [3] STOP ALL (Kills all servers, worker & Docker)" -ForegroundColor Red
    Write-Host "  [4] WhatsApp Diagnostic & Pairing Test (Baileys WS)" -ForegroundColor Green
    Write-Host "  [5] Pause / Suspend Docker Stack" -ForegroundColor Yellow
    Write-Host "  [6] Resume Suspended Docker Stack" -ForegroundColor Cyan
    Write-Host "  [7] Full Rebuild (Prisma, TypeScript, Next.js)" -ForegroundColor Yellow
    Write-Host "  [8] Run Automated Tests (Vitest Suite)" -ForegroundColor Green
    Write-Host "  [9] Open Dashboard in Browser (http://localhost:3000)" -ForegroundColor Cyan
    Write-Host "  [0] Exit" -ForegroundColor Gray
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
}

$running = $true

while ($running) {
    Show-Menu
    $choice = Read-Host " Select an option [0-9]"
    Write-Host ""

    switch ($choice) {
        "1" {
            Write-Host "[ACTION] Launching services locally..." -ForegroundColor Green
            & "$PSScriptRoot\start-local.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "2" {
            Write-Host "[ACTION] Launching services in Docker..." -ForegroundColor Green
            & "$PSScriptRoot\start-docker.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "3" {
            Write-Host "[ACTION] Stopping all services and background processes..." -ForegroundColor Red
            & "$PSScriptRoot\stop-docker.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "4" {
            Write-Host "[ACTION] Running WhatsApp Baileys Diagnostic..." -ForegroundColor Green
            npm --workspace=@whatsapp-auth/whatsapp-worker run diagnostic
            Read-Host "Press Enter to return to menu..."
        }
        "5" {
            Write-Host "[ACTION] Suspending Docker containers..." -ForegroundColor Yellow
            & "$PSScriptRoot\pause-docker.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "6" {
            Write-Host "[ACTION] Resuming Docker containers..." -ForegroundColor Cyan
            & "$PSScriptRoot\resume-docker.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "7" {
            Write-Host "[ACTION] Building all packages & Docker images..." -ForegroundColor Yellow
            & "$PSScriptRoot\build-all.ps1"
            Read-Host "Press Enter to return to menu..."
        }
        "8" {
            Write-Host "[ACTION] Running test suite..." -ForegroundColor Green
            npx vitest run
            Read-Host "Press Enter to return to menu..."
        }
        "9" {
            Write-Host "[ACTION] Opening Dashboard..." -ForegroundColor Cyan
            Start-Process "http://localhost:3000"
            Start-Sleep -Seconds 1
        }
        "0" {
            Write-Host "Exiting Control Center. Goodbye!" -ForegroundColor Gray
            $running = $false
        }
        default {
            Write-Host "Invalid option. Please choose between 0 and 9." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
