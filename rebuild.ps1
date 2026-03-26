# rebuild.ps1 Первый запуск или после изменений - полная пересборка
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Rebuilding Docker Containers with Seed" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/10] Stopping and removing old containers..." -ForegroundColor Blue
docker-compose down -v

Write-Host "[2/10] Removing old images..." -ForegroundColor Blue
docker-compose rm -f

Write-Host "[3/10] Cleaning Docker cache..." -ForegroundColor Blue
docker system prune -a -f --volumes

Write-Host "[4/10] Building Docker images..." -ForegroundColor Blue
docker-compose build --no-cache

Write-Host "[5/10] Starting containers..." -ForegroundColor Blue
docker-compose up -d

Write-Host "[6/10] Waiting for PostgreSQL..." -ForegroundColor Blue
Start-Sleep -Seconds 15

Write-Host "[7/10] Applying database schema..." -ForegroundColor Blue
docker-compose exec -T app npx prisma db push

Write-Host "[8/10] Generating Prisma Client..." -ForegroundColor Blue
docker-compose exec -T app npx prisma generate

Write-Host "[9/10] Seeding database..." -ForegroundColor Blue
docker-compose exec -T app node prisma/seed.js

Write-Host "[10/10] Restarting application..." -ForegroundColor Blue
docker-compose restart app

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Rebuild completed successfully!" -ForegroundColor Green
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
