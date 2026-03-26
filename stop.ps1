# stop.ps1
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Stopping Docker Containers" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Stopping containers..." -ForegroundColor Blue
docker-compose down

Write-Host ""
Write-Host "Containers stopped successfully!" -ForegroundColor Green
Write-Host ""