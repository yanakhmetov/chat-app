# start.ps1 Обычный запуск (без пересборки)
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Starting Docker Containers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Starting containers..." -ForegroundColor Blue
docker-compose up -d

Write-Host "[2/5] Waiting for PostgreSQL..." -ForegroundColor Blue
Start-Sleep -Seconds 10

Write-Host "[3/5] Applying database schema..." -ForegroundColor Blue
docker-compose exec -T app npx prisma db push

Write-Host "[4/5] Generating Prisma Client..." -ForegroundColor Blue
docker-compose exec -T app npx prisma generate

Write-Host "[5/5] Restarting application..." -ForegroundColor Blue
docker-compose restart app

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Show DB: docker-compose exec app npx prisma studio"-ForegroundColor Yellow
Write-Host "DB: http://localhost:5555" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login: alex@example.com" -ForegroundColor Yellow
Write-Host "Password: password123" -ForegroundColor Yellow
Write-Host ""