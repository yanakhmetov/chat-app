# reset.ps1 для полного сброса
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Resetting Docker Containers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Stopping and removing containers..." -ForegroundColor Blue
docker-compose down -v

Write-Host "[2/4] Cleaning Docker cache..." -ForegroundColor Blue
docker system prune -f

Write-Host "[3/4] Starting containers..." -ForegroundColor Blue
docker-compose up -d

Write-Host "[4/4] Initializing database..." -ForegroundColor Blue
Start-Sleep -Seconds 10
docker-compose exec -T app npx prisma db push
docker-compose exec -T app npx prisma generate

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Reset completed successfully!" -ForegroundColor Green
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