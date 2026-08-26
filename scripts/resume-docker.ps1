# WhatsApp Auth - Resume Suspended Services
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp Auth - Resuming Services" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

docker compose unpause

Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host "[SUCCESS] All services have resumed running!" -ForegroundColor Green
Write-Host "  -> Dashboard: http://localhost:3000" -ForegroundColor Cyan
