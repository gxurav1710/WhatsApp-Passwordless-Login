# WhatsApp Auth - Complete Build Script (Monorepo & Docker Images)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  WhatsApp Auth - Full Project Build Pipeline" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Monorepo TypeScript Packages Build
Write-Host "[1/5] Building Protocol, Security, Core & SDK packages..." -ForegroundColor Yellow
npm --workspace=@whatsapp-auth/protocol run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm --workspace=@whatsapp-auth/security run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm --workspace=@whatsapp-auth/core run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm --workspace=@whatsapp-auth/sdk run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Prisma Database Client Generation & Build
Write-Host "[2/5] Generating Prisma Database Client & Building DB package..." -ForegroundColor Yellow
npm --workspace=@whatsapp-auth/db run prisma:generate
npm --workspace=@whatsapp-auth/db run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 3. Build Backend API and WhatsApp Worker
Write-Host "[3/5] Compiling Auth Core API & WhatsApp Worker..." -ForegroundColor Yellow
npm --workspace=@whatsapp-auth/api run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm --workspace=@whatsapp-auth/whatsapp-worker run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 4. Build Next.js Dashboard Production Bundle
Write-Host "[4/5] Compiling Next.js Developer Dashboard..." -ForegroundColor Yellow
npm --workspace=@whatsapp-auth/dashboard run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 5. Build Docker Containers
Write-Host "[5/5] Building Docker Container Images..." -ForegroundColor Yellow
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    docker compose build
} else {
    Write-Host "[INFO] Docker CLI not in PATH; skipped container image build." -ForegroundColor Gray
}

Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host "[SUCCESS] Full build completed successfully with 0 errors!" -ForegroundColor Green
