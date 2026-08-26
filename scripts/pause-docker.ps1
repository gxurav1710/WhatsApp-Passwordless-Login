# WhatsApp Auth - Suspend / Pause Running Services
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp Auth - Suspending (Pausing) Services" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

docker compose pause

Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host "[INFO] All services have been suspended in memory. Run resume-docker.bat to unpause." -ForegroundColor Yellow
